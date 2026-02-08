"use client";

import Link from "next/link";
import { User, Activity, ArrowLeft, Copy, Check, Eye, EyeOff, FileText, AlertTriangle, Fingerprint } from "lucide-react";
import { usePeer } from "../../context/PeerContext";
import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { encryptData, decryptData, generateKey, exportKey, importKey } from "../../lib/glassvault";
import { togglePatientVisibility, submitPatientData } from "../actions";

export default function PatientPage() {
    const { myId, isOnline } = usePeer();
    const [copied, setCopied] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [recentAccessLogs, setRecentAccessLogs] = useState<any[]>([]);

    // Patient Medical Form State (Default data if nothing in vault)
    const [medicalData, setMedicalData] = useState({
        name: "",
        age: 0,
        weight: 0,
        bloodType: "",
        conditions: [] as string[],
        medications: [] as string[],
        allergies: [] as string[]
    });
    const [isEditing, setIsEditing] = useState(false);
    const [vaultKey, setVaultKey] = useState<CryptoKey | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    // GLASSVAULT: ZERO TRUST LOCAL STORAGE
    useEffect(() => {
        const initVault = async () => {
            try {
                // 1. Load or Create Key
                let key: CryptoKey;
                const storedKey = localStorage.getItem("glassvault_key");

                if (storedKey) {
                    key = await importKey(JSON.parse(storedKey));
                } else {
                    key = await generateKey();
                    const exported = await exportKey(key);
                    localStorage.setItem("glassvault_key", JSON.stringify(exported));
                }
                setVaultKey(key);

                // 2. Load Encrypted Data
                const storedVault = localStorage.getItem("glassvault_data");
                if (storedVault) {
                    const { shards, iv } = JSON.parse(storedVault);
                    const decryptedJson = await decryptData(shards, key, iv);
                    const loadedData = JSON.parse(decryptedJson);

                    // Merge with defaults to ensure new fields (age, weight) exist if missing
                    setMedicalData({
                        name: loadedData.name || "",
                        age: typeof loadedData.age === 'number' ? loadedData.age : 35, // Default age if missing
                        weight: typeof loadedData.weight === 'number' ? loadedData.weight : 75, // Default weight if missing
                        bloodType: loadedData.bloodType || "O+",
                        conditions: Array.isArray(loadedData.conditions) ? loadedData.conditions : [],
                        medications: Array.isArray(loadedData.medications) ? loadedData.medications : [],
                        allergies: Array.isArray(loadedData.allergies) ? loadedData.allergies : []
                    });
                } else {
                    // Initialize Default
                    setMedicalData({
                        name: "John Doe",
                        age: 35,
                        weight: 75,
                        bloodType: "O+",
                        conditions: ["WASP ALLERGY"],
                        medications: ["EPIPEN"],
                        allergies: ["WASP STINGS"]
                    });
                }
            } catch (err) {
                console.error("Vault Corruption / Key Mismatch:", err);
                // Fallback reset: Clear corrupted data and set safe defaults
                localStorage.removeItem("glassvault_data");
                localStorage.removeItem("glassvault_key");
                setMedicalData({
                    name: "John Doe",
                    age: 35,
                    weight: 75,
                    bloodType: "O+",
                    conditions: ["WASP ALLERGY"],
                    medications: ["EPIPEN"],
                    allergies: ["WASP STINGS"]
                });
            }
        };
        initVault();
    }, []);

    const saveToVault = async (data: any) => {
        if (!vaultKey) return;
        try {
            const json = JSON.stringify(data);
            const encrypted = await encryptData(json, vaultKey);
            localStorage.setItem("glassvault_data", JSON.stringify(encrypted));
        } catch (e) {
            console.error("Encryption Failed:", e);
        }
    };

    // Generate QR Code when ID is ready
    useEffect(() => {
        if (myId && canvasRef.current) {
            QRCode.toCanvas(canvasRef.current, myId, {
                width: 200,
                margin: 2,
                color: {
                    dark: '#00FFAA',
                    light: '#00000000'
                }
            });
        }
    }, [myId]);

    // Handle Visbility & Heartbeat & Log Polling
    useEffect(() => {
        let interval: NodeJS.Timeout;

        const syncVisibility = async () => {
            const res = await togglePatientVisibility(myId, isVisible, medicalData);
            if (res.recentLogs && res.recentLogs.length > 0) {
                // Update logs if changed
                setRecentAccessLogs(prev => {
                    // Simple check to see if we have new logs
                    if (prev.length !== res.recentLogs.length) return res.recentLogs;
                    return prev;
                });
            }
        };

        if (isVisible && myId) {
            syncVisibility(); // Initial
            interval = setInterval(syncVisibility, 5000); // Heartbeat
        } else if (!isVisible && myId) {
            togglePatientVisibility(myId, false);
        }

        return () => {
            if (interval) clearInterval(interval);
            if (myId && isVisible) togglePatientVisibility(myId, false);
        };
    }, [isVisible, myId, medicalData]);

    const handleSaveData = async () => {
        setIsEditing(false);
        // 1. Zero Trust: Encrypt locally first
        await saveToVault(medicalData);
        // 2. Sync to Mesh (Server handles its own encryption)
        if (myId) await submitPatientData(myId, medicalData);
    };

    const copyToClipboard = async () => {
        if (!myId) return;
        try {
            await navigator.clipboard.writeText(myId);
            setCopied(true);
        } catch {
            setCopied(true);
        }
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden text-center pb-20 bg-background text-foreground">

            <div className="absolute top-6 left-6 z-20">
                <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-mono text-sm">BACK</span>
                </Link>
            </div>

            <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center mb-6 animate-float">
                <User className="w-12 h-12 text-primary" />
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2 tracking-tight">PATIENT VAULT</h1>

            {/* Status Indicators */}
            <div className={`flex items-center gap-4 mb-6 text-sm font-mono flex-wrap justify-center`}>
                <div className={`flex items-center gap-2 ${isOnline ? 'text-emerald-600' : 'text-red-600'}`}>
                    <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                    {isOnline ? 'ONLINE' : 'CONNECTING...'}
                </div>
                <div className={`flex items-center gap-2 ${isVisible ? 'text-blue-600' : 'text-muted-foreground'}`}>
                    <span className={`w-2 h-2 rounded-full ${isVisible ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'}`}></span>
                    {isVisible ? 'BROADCASTING' : 'HIDDEN'}
                </div>
            </div>

            {/* ERROR / ACCESS ALERT */}
            {recentAccessLogs.length > 0 && (
                <div className="w-full max-w-md bg-red-50 border border-red-200 mb-6 p-4 rounded-xl flex items-start gap-3 text-left animate-in slide-in-from-top-4">
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-red-700 font-bold text-sm">EMERGENCY ACCESS DETECTED</h3>
                        <p className="text-xs text-red-600 mt-1">
                            Your medical record was accessed by:
                            <br /> <span className="font-mono">{recentAccessLogs[0].doctor_id}</span>
                            <br /> <span>{new Date(recentAccessLogs[0].timestamp).toLocaleTimeString()}</span>
                        </p>
                        <div className="mt-2 text-[10px] text-red-600 uppercase tracking-wider">Logged to "The Ghost" Ledger</div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-4xl">
                {/* Left Column: Connectivity */}
                <div className="glass-card p-6 rounded-xl border border-black/20 space-y-6 flex flex-col justify-between">
                    {/* Visibility Toggle */}
                    <button
                        onClick={async () => {
                            if (!isVisible) {
                                // BIO-RAIDER: Simulate Biometrics
                                const bioAuth = confirm("BIO-RAIDER SECURITY CHECK:\n\nPlease authenticate with FaceID / Biometrics to enable beacon.");
                                if (!bioAuth) return;
                            }
                            setIsVisible(!isVisible);
                        }}
                        className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 transition-all font-mono text-sm border ${isVisible
                            ? "bg-blue-500 text-white border-blue-600 hover:bg-blue-600"
                            : "bg-secondary text-foreground border-transparent hover:bg-black/10"
                            }`}
                    >
                        {isVisible ? <><Eye className="w-4 h-4" /> STOP BROADCAST</> : <><Fingerprint className="w-4 h-4" /> AUTH & BROADCAST</>}
                    </button>

                    {/* QR Code */}
                    <div className={`flex flex-col items-center justify-center p-6 bg-white rounded-lg border border-black/20 transition-opacity duration-300 flex-1 min-h-[200px] ${isVisible ? 'opacity-100' : 'opacity-50 blur-[1px]'}`}>
                        <canvas ref={canvasRef} className="rounded-lg mb-4" />
                        <div className="flex items-center gap-2 w-full max-w-[200px]">
                            <code className="text-xs text-primary truncate flex-1 font-mono bg-secondary p-1.5 rounded">
                                {myId || "..."}
                            </code>
                            <button onClick={copyToClipboard} className="text-muted-foreground hover:text-primary">
                                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center justify-center gap-3 text-muted-foreground pt-4 border-t border-black/20">
                        <Activity className={`w-5 h-5 ${isVisible ? 'animate-pulse text-blue-500' : 'text-muted-foreground'}`} />
                        <span>{isVisible ? 'Broadcasting health shards...' : 'Health data encrypted & offline'}</span>
                    </div>
                </div>

                {/* Right Column: Medical Data Input */}
                <div className="glass-card p-6 rounded-xl border border-black/5 text-left relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                        <button
                            onClick={() => isEditing ? handleSaveData() : setIsEditing(true)}
                            className="text-xs font-mono flex items-center gap-1 text-primary hover:text-black transition-colors"
                        >
                            {isEditing ? <><Check className="w-3 h-3" /> SAVE</> : <><FileText className="w-3 h-3" /> EDIT DATA</>}
                        </button>
                    </div>

                    <h3 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-accent" />
                        MY RELAY DATA
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-muted-foreground font-mono">FULL NAME</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={medicalData.name}
                                    onChange={e => setMedicalData({ ...medicalData, name: e.target.value })}
                                    className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm text-primary focus:border-accent outline-none"
                                />
                            ) : (
                                <p className="text-primary font-mono text-lg">{medicalData.name}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-muted-foreground font-mono">BLOOD TYPE</label>
                                {isEditing ? (
                                    <select
                                        value={medicalData.bloodType}
                                        onChange={e => setMedicalData({ ...medicalData, bloodType: e.target.value })}
                                        className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm text-primary focus:border-accent outline-none"
                                    >
                                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                ) : (
                                    <p className="text-primary font-mono text-xl">{medicalData.bloodType}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-muted-foreground font-mono">KNOWN ALLERGIES</label>
                            {isEditing ? (
                                <textarea
                                    value={medicalData.allergies.join(", ")}
                                    onChange={e => setMedicalData({ ...medicalData, allergies: e.target.value.split(",").map(s => s.trim()) })}
                                    className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm text-primary focus:border-accent outline-none h-20"
                                    placeholder="Comma separated"
                                />
                            ) : (
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {medicalData.allergies.map((a, i) => (
                                        <span key={i} className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded border border-red-200">{a}</span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-muted-foreground font-mono">AGE (YRS)</label>
                                {isEditing ? (
                                    <input
                                        type="number"
                                        value={medicalData.age}
                                        onChange={e => {
                                            const val = parseInt(e.target.value);
                                            setMedicalData({ ...medicalData, age: isNaN(val) ? 0 : val });
                                        }}
                                        className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm text-primary focus:border-accent outline-none"
                                    />
                                ) : (
                                    <p className="text-primary font-mono text-lg">{medicalData.age || '--'}</p>
                                )}
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground font-mono">WEIGHT (KG)</label>
                                {isEditing ? (
                                    <input
                                        type="number"
                                        value={medicalData.weight}
                                        onChange={e => {
                                            const val = parseInt(e.target.value);
                                            setMedicalData({ ...medicalData, weight: isNaN(val) ? 0 : val });
                                        }}
                                        className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm text-primary focus:border-accent outline-none"
                                    />
                                ) : (
                                    <p className="text-primary font-mono text-lg">{medicalData.weight || '--'}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-muted-foreground font-mono">CRITICAL CHRONIC CONDITIONS</label>
                            {isEditing ? (
                                <textarea
                                    value={medicalData.conditions.join(", ")}
                                    onChange={e => setMedicalData({ ...medicalData, conditions: e.target.value.split(",").map(s => s.trim()) })}
                                    className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm text-primary focus:border-accent outline-none h-16"
                                    placeholder="e.g. Diabetes, Asthma"
                                />
                            ) : (
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {medicalData.conditions.map((c, i) => (
                                        <span key={i} className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded border border-yellow-200">{c}</span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="text-xs text-muted-foreground font-mono">HIGH RISK MEDICATIONS</label>
                            {isEditing ? (
                                <textarea
                                    value={medicalData.medications.join(", ")}
                                    onChange={e => setMedicalData({ ...medicalData, medications: e.target.value.split(",").map(s => s.trim()) })}
                                    className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm text-primary focus:border-accent outline-none h-16"
                                    placeholder="e.g. Warfarin, Insulin"
                                />
                            ) : (
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {medicalData.medications.map((m, i) => (
                                        <span key={i} className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded border border-blue-200">{m}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
