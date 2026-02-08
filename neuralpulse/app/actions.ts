"use server";

import { v4 as uuidv4 } from "uuid";
import { query } from "../lib/db";
import { PulseSchema, PatientDataSchema } from "../lib/politequestion";
import { generateHash, AuditLog } from "../lib/theghost";
import { encryptPacket, decryptPacket } from "../lib/server-vault";

// In-memory fallback (Still maintained for logs fallback if DB fails)
declare global {
    var _neuralPulseLogs: AuditLog[] | undefined;
}
if (!globalThis._neuralPulseLogs) {
    globalThis._neuralPulseLogs = [];
}
let accessLogs = globalThis._neuralPulseLogs!;

// THE GHOST: Hash-Chained Logging
async function logAccess(doctorId: string, patientId: string, details: string) {
    const timestamp = new Date().toISOString();
    let prevHash = "0000000000000000000000000000000000000000000000000000000000000000"; // Genesis

    // Fetch last log from DB if possible
    try {
        const res = await query("SELECT current_hash FROM access_logs ORDER BY timestamp DESC LIMIT 1");
        if (res.rows.length > 0) prevHash = res.rows[0].current_hash;
    } catch (e) {
        if (accessLogs.length > 0) prevHash = accessLogs[accessLogs.length - 1].currentHash;
    }

    // Create Log Object Structure
    const logData = {
        id: uuidv4(),
        timestamp,
        action: "EMERGENCY_OVERRIDE",
        details,
        prevHash,
        patient_id: patientId,
        doctor_id: doctorId
    };

    // Generate Current Hash (Signature)
    const currentHash = generateHash(logData);

    const logEntry: AuditLog = {
        ...logData,
        currentHash
    };

    // Persist (DB or Memory)
    try {
        await query(
            "INSERT INTO access_logs (id, doctor_id, patient_id, access_type, details, timestamp, prev_hash, current_hash) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
            [logEntry.id, doctorId, patientId, logEntry.action, details, timestamp, prevHash, currentHash]
        );
    } catch (err) {
        accessLogs.push(logEntry);
    }

    return logEntry;
}

// --------------------------------------------------------
// PATIENT ACTIONS (ENCRYPTED STORAGE)
// --------------------------------------------------------

export async function submitPatientData(patientId: string, medicalData: any) {
    // Validate Inputs
    const result = PatientDataSchema.safeParse(medicalData);
    if (!result.success) throw new Error("Security Alert: Malformed Data Detected (Regex Guard)");

    // ENCRYPT ALWAYS (At Rest)
    const encryptedPayload = encryptPacket(result.data);

    try {
        // Upsert into DB
        await query(
            `INSERT INTO patients (id, encrypted_data, last_seen) 
           VALUES ($1, $2, NOW())
           ON CONFLICT (id) DO UPDATE 
           SET encrypted_data = $2, last_seen = NOW()`,
            [patientId, encryptedPayload]
        );
    } catch (err) {
        console.error("DB Error:", err);
    }

    return { success: true };
}

export async function togglePatientVisibility(patientId: string, isVisible: boolean, medicalData?: any) {
    if (!patientId || patientId.length > 255) return { success: false, error: "Invalid ID" };

    if (isVisible) {
        if (medicalData) {
            const result = PatientDataSchema.safeParse(medicalData);
            if (!result.success) {
                console.error("Action Security Error (Validation):", JSON.stringify(result.error.issues, null, 2));
                return { success: false, error: "Security Guard: Input Blocked" };
            }

            // Encrypt & Store
            const encryptedPayload = encryptPacket(result.data);
            try {
                await query(
                    `INSERT INTO patients (id, encrypted_data, last_seen) 
                 VALUES ($1, $2, NOW())
                 ON CONFLICT (id) DO UPDATE 
                 SET encrypted_data = $2, last_seen = NOW()`,
                    [patientId, encryptedPayload]
                );
            } catch (e) {
                console.error("Update Error", e);
            }
        } else {
            // Just heartbeat update
            try {
                await query("UPDATE patients SET last_seen = NOW() WHERE id = $1", [patientId]);
            } catch (e) { }
        }

        // Check recent logs (Access Notification)
        let recentLogs: any[] = [];
        try {
            const res = await query(
                "SELECT * FROM access_logs WHERE patient_id = $1 AND timestamp > NOW() - interval '30 seconds' ORDER BY timestamp DESC",
                [patientId]
            );
            recentLogs = res.rows;
        } catch (e) {
            recentLogs = accessLogs.filter(l =>
                l.patient_id === patientId &&
                (new Date().getTime() - new Date(l.timestamp).getTime() < 30000)
            );
        }

        return { success: true, recentLogs };
    } else {
        // Hide patient (Delete from active view)
        try {
            await query("DELETE FROM patients WHERE id = $1", [patientId]);
        } catch (e) { }
        return { success: true, recentLogs: [] };
    }
}

export async function getVisiblePatients() {
    try {
        // Get active patients seen in last 5 mins
        const res = await query("SELECT * FROM patients WHERE last_seen > NOW() - interval '5 minutes'");

        const patients = res.rows.map(row => {
            try {
                // DECRYPT ON DEMAND
                const data = decryptPacket(row.encrypted_data);
                return {
                    id: row.id,
                    name: data.name || 'Unknown',
                    condition: (data.conditions && data.conditions.length > 0) ? data.conditions[0] : 'Unknown',
                    lastSeen: new Date(row.last_seen).getTime()
                };
            } catch (e) {
                return null; // Decryption failed or bad data
            }
        }).filter(p => p !== null);

        return patients;
    } catch (e) {
        console.error("Fetch Error", e);
        return [];
    }
}

export async function getPatientEmergencyInfo(patientId: string, doctorId: string = "DOCTOR-DEVICE-1") {
    try {
        const res = await query("SELECT * FROM patients WHERE id = $1", [patientId]);
        if (res.rows.length === 0) return null;

        const row = res.rows[0];
        const data = decryptPacket(row.encrypted_data); // Decrypt fully for doctor

        // BIO-RAIDER / GHOST: Instant Immutable Log
        const logEntry = await logAccess(doctorId, patientId, "EMERGENCY_DATA_REQ");

        return {
            id: row.id,
            ...data,
            lastSeen: new Date(row.last_seen).getTime(),
            accessLog: logEntry
        };
    } catch (e) {
        console.error(e);
        return null;
    }
}

// Auditor PIN Verification (Server-Side)
const AUDITOR_PIN = process.env.AUDITOR_PIN || "1234"; // Set in .env for production

export async function verifyAuditorPin(pin: string): Promise<{ success: boolean; error?: string }> {
    // Server-side comparison - never expose the real PIN
    if (!pin || typeof pin !== "string") {
        return { success: false, error: "PIN required" };
    }

    // Constant-time comparison to prevent timing attacks
    if (pin.length !== AUDITOR_PIN.length) {
        return { success: false, error: "Invalid PIN" };
    }

    let isValid = true;
    for (let i = 0; i < pin.length; i++) {
        if (pin[i] !== AUDITOR_PIN[i]) {
            isValid = false;
        }
    }

    if (!isValid) {
        return { success: false, error: "Invalid PIN" };
    }

    return { success: true };
}

export async function getAccessLogs(pin: string) {
    // Verify PIN server-side before returning any logs
    const verification = await verifyAuditorPin(pin);
    if (!verification.success) {
        throw new Error(verification.error || "Unauthorized");
    }

    try {
        const res = await query("SELECT * FROM access_logs ORDER BY timestamp DESC LIMIT 50");
        return res.rows;
    } catch (e) {
        return accessLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
}
