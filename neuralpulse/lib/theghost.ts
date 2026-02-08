
import { createHash } from "crypto"; // Use Node.js crypto for SHA-256

// THE GHOST: MUTABLE LOGS NOT ALLOWED
// Implements Hash-Chaining


export interface AuditLog {
    id: string;
    timestamp: string;
    action: string;
    details: string;
    prevHash: string; // The "Gold Link"
    currentHash: string; // Signature of this log
    patient_id: string;
    doctor_id: string;
}

export function generateHash(log: Omit<AuditLog, "currentHash">): string {
    // Include ALL fields in the hash for integrity
    const data = `${log.id}${log.timestamp}${log.action}${log.details}${log.prevHash}${log.patient_id}${log.doctor_id}`;
    return createHash("sha256").update(data).digest("hex");
}

export function verifyChain(logs: AuditLog[]): boolean {
    for (let i = 1; i < logs.length; i++) {
        const currentLog = logs[i];
        const prevLog = logs[i - 1];

        // 1. Verify Hash Integrity
        // We must reconstruct the object without currentHash
        const { currentHash, ...logData } = currentLog;
        const expectedHash = generateHash(logData);

        if (expectedHash !== currentLog.currentHash) {
            console.error(`Hash mismatch at log ${i}: Expected ${expectedHash}, got ${currentLog.currentHash}`);
            return false;
        }

        // 2. Verify Chain Link
        if (currentLog.prevHash !== prevLog.currentHash) {
            console.error(`Chain break at log ${i}: Link ${currentLog.prevHash} != ${prevLog.currentHash}`);
            return false;
        }
    }
    return true;
}
