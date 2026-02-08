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
                    <div className="w-full max-w-4xl animate-in fade-in zoom-in-95">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-8 pb-6 border-b border-border">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center border border-black/20">
                                        <User className="w-8 h-8 text-primary" />
                                    </div>
                                    <div className="text-left">
                                        <h2 className="text-2xl font-bold text-primary">{patientData.name}</h2>
                                        <p className="text-sm font-mono text-muted-foreground">ID: {patientData.id.substring(0, 12)}...</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs bg-secondary px-2 py-0.5 rounded text-muted-foreground border border-gray-300">AGE: {patientData.age || 'N/A'}</span>
                                            <span className="text-xs bg-secondary px-2 py-0.5 rounded text-muted-foreground border border-gray-300">WEIGHT: {patientData.weight ? patientData.weight + 'kg' : 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-4xl font-black text-red-600">{patientData.bloodType}</div>
                                    <div className="text-xs font-mono text-red-700 font-bold">BLOOD TYPE</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="text-left">
                                        <h3 className="text-xs font-mono text-red-700 mb-2 flex items-center gap-2 font-bold">
                                            <AlertTriangle className="w-3 h-3" /> CRITICAL CONDITIONS
                                        </h3>
                                        <div className="flex flex-wrap gap-2 text-left">
                                            {patientData.conditions && patientData.conditions.length > 0 ? (
                                                patientData.conditions.map((c: string, i: number) => (
                                                    <span key={i} className="bg-red-100 text-red-800 px-3 py-1.5 rounded-lg border border-red-300 text-sm font-bold">
                                                        {c}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-muted-foreground text-sm italic">None reported</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-left">
                                        <h3 className="text-xs font-mono text-orange-700 mb-2 flex items-center gap-2 font-bold">
                                            <AlertTriangle className="w-3 h-3" /> HIGH RISK MEDICATIONS
                                        </h3>
                                        <div className="flex flex-wrap gap-2 text-left">
                                            {patientData.medications && patientData.medications.length > 0 ? (
                                                patientData.medications.map((m: string, i: number) => (
                                                    <span key={i} className="bg-orange-100 text-orange-800 px-3 py-1.5 rounded-lg border border-orange-300 text-sm font-bold">
                                                        {m}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-muted-foreground text-sm italic">None reported</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="text-left">
                                    <h3 className="text-xs font-mono text-blue-700 mb-2 flex items-center gap-2 font-bold">
                                        <Activity className="w-3 h-3" /> ALLERGIES
                                    </h3>
                                    <div className="flex flex-wrap gap-2 text-left">
                                        {patientData.allergies && patientData.allergies.length > 0 ? (
                                            patientData.allergies.map((a: string, i: number) => (
                                                <span key={i} className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg border border-blue-300 text-sm font-bold">
                                                    {a}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-muted-foreground text-sm italic">None reported</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 text-center">
                            <button
                                onClick={() => setSelectedPatientId(null)}
                                className="bg-secondary hover:bg-gray-200 text-primary font-medium px-4 py-2 rounded-lg text-sm border border-black/20"
                            >
                                DISCONNECT VIEW
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-6 mt-8">
                            {/* Vital Signs Card */}
                            <div className="glass-card p-6 rounded-xl border border-emerald-600 text-left">
                                <h3 className="text-sm font-mono text-emerald-700 mb-4 flex items-center gap-2 font-bold">
                                    <Activity className="w-4 h-4" /> LIVE VITALS {loadingData && "(Syncing...)"}
                                </h3>

                                {patientData ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-secondary rounded-lg border border-black/20">
                                            <p className="text-xs text-muted-foreground font-bold">HEART RATE</p>
                                            <p className="text-2xl text-primary font-mono font-bold">{patientData.recentVitals?.heartRate ?? '--'} <span className="text-xs text-muted-foreground">BPM</span></p>
                                        </div>
                                        <div className="p-3 bg-secondary rounded-lg border border-black/20">
                                            <p className="text-xs text-muted-foreground font-bold">O2 SAT</p>
                                            <p className="text-2xl text-primary font-mono font-bold">{patientData.recentVitals?.oxygenSat ?? '--'} <span className="text-xs text-muted-foreground">%</span></p>
                                        </div>
                                        <div className="p-3 bg-secondary rounded-lg border border-black/20 col-span-2">
                                            <p className="text-xs text-muted-foreground font-bold">BLOOD TYPE & CONDITIONS</p>
                                            <p className="text-xl text-primary font-mono font-bold">{patientData.bloodType}</p>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {patientData.conditions?.length > 0 ? (
                                                    patientData.conditions.map((c: string, i: number) => (
                                                        <span key={i} className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] rounded border border-red-200 font-bold">{c}</span>
                                                    ))
                                                ) : <span className="text-[10px] text-muted-foreground italic">None</span>}
                                            </div>
                                        </div>
                                        <div className="p-3 bg-secondary rounded-lg border border-black/20 col-span-2">
                                            <p className="text-xs text-muted-foreground font-bold">MEDICATIONS</p>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {patientData.medications?.length > 0 ? (
                                                    patientData.medications.map((m: string, i: number) => (
                                                        <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] rounded border border-blue-200 font-bold">{m}</span>
                                                    ))
                                                ) : <span className="text-[10px] text-muted-foreground italic">None</span>}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-40 text-muted-foreground">
                                        <p>Waiting for secure handshake...</p>
                                    </div>
                                )}
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
