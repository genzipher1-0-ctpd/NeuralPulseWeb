"use client";

import Link from "next/link";
import { Stethoscope, User, AlertTriangle, Activity, ArrowLeft, RefreshCw, Radio, Search, CheckCircle, Smartphone, Wifi, FileText, Plug, ShieldCheck } from "lucide-react";
import { usePeer } from "../../context/PeerContext";
import { useState, useEffect } from "react";
import { getVisiblePatients, getPatientEmergencyInfo } from "../actions";

export default function DoctorPage() {
    // We still keep peer context for the P2P shards if available, but we rely on Server Actions for discovery/info
    const { connectToPeer, connections, breakGlass } = usePeer();
    const [targetId, setTargetId] = useState("");
    const [nearbyPeers, setNearbyPeers] = useState<any[]>([]); // Changed to any[] to hold full patient object
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const [patientData, setPatientData] = useState<any>(null); // Store fetched emergency data
    const [loadingData, setLoadingData] = useState(false);

    // Poll for visible patients using Server Action
    useEffect(() => {
        const fetchPeers = async () => {
            try {
                const patients = await getVisiblePatients();
                setNearbyPeers(patients);
            } catch (err) {
                console.error("Failed to fetch visible patients:", err);
            }
        };
        fetchPeers();
        const interval = setInterval(fetchPeers, 3000); // Poll every 3s
        return () => clearInterval(interval);
    }, []);

    // Fetch patient data when selected
    useEffect(() => {
        if (selectedPatientId) {
            const fetchData = async () => {
                setLoadingData(true);
                try {
                    const data = await getPatientEmergencyInfo(selectedPatientId);
                    setPatientData(data);
                } catch (err) {
                    console.error("Failed to fetch patient data:", err);
                } finally {
                    setLoadingData(false);
                }
            };
            fetchData();
        } else {
            setPatientData(null);
        }
    }, [selectedPatientId]);

    const handleConnect = (id: string) => {
        if (id) {
            // Try P2P connection (might fail if server down, but that's ok for this requirement)
            connectToPeer(id, "DOCTOR");
            setSelectedPatientId(id);
        }
    };

    const isConnectedP2P = (id: string) => connections.some(c => c.peer === id);



    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden text-center bg-background text-foreground">

            <div className="absolute top-6 left-6 z-20">
                <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-mono text-sm">BACK</span>
                </Link>
            </div>

            {/* DASHBOARD VIEW (When Connected) */}
            {selectedPatientId ? (
                !patientData ? (
                    <div className="flex flex-col items-center justify-center min-h-[50vh] animate-in fade-in">
                        <RefreshCw className="w-12 h-12 text-primary animate-spin mb-4" />
                        <h2 className="text-xl font-bold text-primary">ESTABLISHING SECURE LINK...</h2>
                        <p className="text-sm text-muted-foreground font-mono">Handshake in progress</p>
                        <button
                            onClick={() => setSelectedPatientId(null)}
                            className="mt-8 text-xs text-red-600 hover:text-red-500 underline"
                        >
                            CANCEL CONNECTION
                        </button>
                    </div>
                ) : (
                    <div className="w-full max-w-2xl animate-in fade-in zoom-in-95">
                        {/* Compact Patient Card */}
                        <div className="glass-card p-6 rounded-xl border border-black/20">
                            {/* Header Row: Name + Blood Type */}
                            <div className="flex items-start justify-between mb-4 pb-4 border-b border-border">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center border border-black/10">
                                        <User className="w-6 h-6 text-primary" />
                                    </div>
                                    <div className="text-left">
                                        <h2 className="text-xl font-bold text-primary">{patientData.name || "Unknown"}</h2>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">{patientData.age || '--'} yrs</span>
                                            <span className="text-xs bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">{patientData.weight ? patientData.weight + 'kg' : '--'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-center bg-red-100 px-4 py-2 rounded-lg border border-red-300">
                                    <div className="text-3xl font-black text-red-700">{patientData.bloodType || "--"}</div>
                                    <div className="text-[10px] font-mono text-red-600">BLOOD</div>
                                </div>
                            </div>

                            {/* Critical Info Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-left">
                                {/* Allergies */}
                                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                                    <h3 className="text-[10px] font-mono text-red-700 mb-2 font-bold flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" /> ALLERGIES
                                    </h3>
                                    <div className="flex flex-wrap gap-1">
                                        {patientData.allergies && patientData.allergies.length > 0 ? (
                                            patientData.allergies.map((a: string, i: number) => (
                                                <span key={i} className="bg-white text-red-700 px-2 py-0.5 rounded text-xs font-medium border border-red-200">{a}</span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">None</span>
                                        )}
                                    </div>
                                </div>

                                {/* Conditions */}
                                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                    <h3 className="text-[10px] font-mono text-yellow-700 mb-2 font-bold flex items-center gap-1">
                                        <Activity className="w-3 h-3" /> CONDITIONS
                                    </h3>
                                    <div className="flex flex-wrap gap-1">
                                        {patientData.conditions && patientData.conditions.length > 0 ? (
                                            patientData.conditions.map((c: string, i: number) => (
                                                <span key={i} className="bg-white text-yellow-700 px-2 py-0.5 rounded text-xs font-medium border border-yellow-200">{c}</span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">None</span>
                                        )}
                                    </div>
                                </div>

                                {/* Medications */}
                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <h3 className="text-[10px] font-mono text-blue-700 mb-2 font-bold flex items-center gap-1">
                                        <FileText className="w-3 h-3" /> MEDICATIONS
                                    </h3>
                                    <div className="flex flex-wrap gap-1">
                                        {patientData.medications && patientData.medications.length > 0 ? (
                                            patientData.medications.map((m: string, i: number) => (
                                                <span key={i} className="bg-white text-blue-700 px-2 py-0.5 rounded text-xs font-medium border border-blue-200">{m}</span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">None</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Footer with ID and Disconnect */}
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                                <span className="text-[10px] font-mono text-muted-foreground">ID: {patientData.id?.substring(0, 16)}...</span>
                                <button
                                    onClick={() => setSelectedPatientId(null)}
                                    className="text-xs font-mono text-red-600 hover:text-red-700 hover:underline"
                                >
                                    DISCONNECT
                                </button>
                            </div>
                        </div>
                    </div>
                )
            ) : (
                /* SCANNER VIEW (Default) */
                <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4">
                    <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center mb-6 animate-float mx-auto">
                        <Stethoscope className="w-12 h-12 text-primary" />
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2 tracking-tight">RESCUER HUD</h1>
                    <p className="text-muted-foreground font-mono text-sm tracking-widest uppercase mb-8">System Initialized</p>

                    <p className="text-xs text-muted-foreground mb-4 max-w-md mx-auto">
                        Automatic Discovery Active. Click on a patient below to connect.
                    </p>

                    <div className="glass-card p-6 rounded-xl w-full border border-black/20 mb-8 space-y-4">
                        <div className="flex items-center justify-center gap-3 text-muted-foreground pb-4 border-b border-gray-300">
                            <Radio className="w-5 h-5 animate-pulse text-blue-600" />
                            <span>Nearby Pulse Signals ({nearbyPeers.length})</span>
                        </div>

                        {nearbyPeers.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground italic text-sm">
                                No visible patients found...
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
                                {nearbyPeers.map(patient => {
                                    const isP2P = isConnectedP2P(patient.id);
                                    return (
                                        <button
                                            key={patient.id}
                                            onClick={() => handleConnect(patient.id)}
                                            className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${isP2P
                                                ? "bg-emerald-50 border-emerald-600"
                                                : "bg-secondary hover:bg-gray-200 border-transparent hover:border-gray-400"
                                                }`}
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-mono text-xs text-primary truncate max-w-[200px]">{patient.name || patient.id} ({patient.id.substring(0, 4)}...)</span>
                                                <span className="text-[10px] text-muted-foreground font-medium">{patient.condition || "Status Unknown"}</span>
                                            </div>
                                            {isP2P ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded">CONNECTED</span>
                                                    <div className="bg-white p-1 rounded hover:bg-gray-50 border border-gray-200" title="View Dashboard">
                                                        <Activity className="w-3 h-3 text-primary" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <Plug className="w-4 h-4 text-muted-foreground" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Fallback Manual Input */}
                        <div className="flex gap-2 pt-4 border-t border-gray-100">
                            <input
                                type="text"
                                placeholder="Manual Peer ID Entry"
                                value={targetId}
                                onChange={(e) => setTargetId(e.target.value)}
                                className="w-full bg-secondary border border-border rounded-lg px-4 py-2 text-sm text-primary focus:outline-none focus:border-accent"
                            />
                            <button
                                onClick={() => handleConnect(targetId)}
                                className="bg-secondary hover:bg-gray-200 text-primary border border-border rounded-lg px-4 py-2 transition-colors"
                            >
                                <Plug className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
}
