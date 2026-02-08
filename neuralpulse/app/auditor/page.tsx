"use client";

import { useEffect, useState } from "react";
import { getAccessLogs } from "../actions";
import { ShieldAlert, RefreshCw, Lock, FileDigit, Calendar } from "lucide-react";
import Link from "next/link";

export default function AuditorDashboard() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await getAccessLogs();
            setLogs(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    return (
        <div className="min-h-screen p-8 relative overflow-hidden text-center flex flex-col items-center">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-red-900/10 rounded-full blur-[120px]" />
            </div>

            <div className="flex items-center justify-between w-full max-w-6xl mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center border border-red-500/20">
                        <ShieldAlert className="w-6 h-6 text-red-500" />
                    </div>
                    <div className="text-left">
                        <h1 className="text-2xl font-bold text-white tracking-tight">COMPLIANCE AUDIT LOG</h1>
                        <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">GDPR / HIPAA / PDPA LEDGER</p>
                    </div>
                </div>
                <Link href="/" className="text-xs font-mono text-muted-foreground hover:text-white transition-colors">
                    EXIT AUDIT MODE
                </Link>
            </div>

            <div className="w-full max-w-6xl glass-card border border-red-500/20 rounded-xl overflow-hidden flex flex-col h-[70vh]">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/40">
                    <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                        <Lock className="w-3 h-3" />
                        GHOST LEDGER: HASH-CHAIN VERIFIED
                    </div>
                    <button
                        onClick={fetchLogs}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors flex items-center gap-2 text-xs font-mono"
                        disabled={loading}
                    >
                        <RefreshCw className={`w-3 h-3 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
                        SYNC CHAIN
                    </button>
                </div>

                <div className="overflow-auto flex-1 p-0">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white/5 text-xs font-mono text-muted-foreground sticky top-0 backdrop-blur-md">
                            <tr>
                                <th className="p-4 font-normal">LOG ID</th>
                                <th className="p-4 font-normal">TIMESTAMP</th>
                                <th className="p-4 font-normal">ACTOR</th>
                                <th className="p-4 font-normal">SUBJECT</th>
                                <th className="p-4 font-normal">PREV HASH (LINK)</th>
                                <th className="p-4 font-normal">CURRENT HASH (SIG)</th>
                            </tr>
                        </thead>
                        <tbody className="text-xs font-mono text-white/80 divide-y divide-white/5">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-4 text-muted-foreground">{log.id.substring(0, 8)}...</td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                                            <span className="text-[10px] text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-emerald-400">{log.doctor_id}</td>
                                    <td className="p-4 text-blue-400">{log.patient_id}</td>
                                    <td className="p-4 max-w-[100px] truncate text-[10px] text-orange-400/70" title={log.prevHash}>
                                        {log.prevHash ? log.prevHash.substring(0, 12) + "..." : "GENESIS"}
                                    </td>
                                    <td className="p-4 max-w-[100px] truncate text-[10px] text-emerald-400/70 font-bold" title={log.currentHash}>
                                        {log.currentHash ? log.currentHash.substring(0, 12) + "..." : "PENDING"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {logs.length === 0 && !loading && (
                        <div className="h-64 flex flex-col items-center justify-center text-muted-foreground text-sm font-mono">
                            <ShieldAlert className="w-8 h-8 mb-3 opacity-20" />
                            NO ACCESS VIOLATIONS RECORDED
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
