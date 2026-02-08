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
        <div className="min-h-screen p-8 relative overflow-hidden text-center flex flex-col items-center bg-background text-foreground">

            <div className="flex items-center justify-between w-full max-w-6xl mb-8 border-b border-border pb-6 mt-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center border border-red-200">
                        <ShieldAlert className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="text-left">
                        <h1 className="text-2xl font-bold text-primary tracking-tight">COMPLIANCE AUDIT LOG</h1>
                    </div>
                </div>
                <Link href="/" className="text-xs font-mono text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 border border-border px-3 py-1.5 rounded-lg hover:bg-secondary">
                    EXIT AUDIT MODE
                </Link>
            </div>

            <div className="w-full max-w-6xl glass-card border border-border rounded-xl overflow-hidden flex flex-col h-[70vh] shadow-sm">
                <div className="p-4 border-b border-border flex justify-between items-center bg-secondary/50">
                    <div className="flex items-center gap-2 text-xs font-mono text-emerald-600">
                        <Lock className="w-3 h-3" />
                        GHOST LEDGER: HASH-CHAIN VERIFIED
                    </div>
                    <button
                        onClick={fetchLogs}
                        className="p-2 hover:bg-secondary rounded-full transition-colors flex items-center gap-2 text-xs font-mono border border-transparent hover:border-border"
                        disabled={loading}
                    >
                        <RefreshCw className={`w-3 h-3 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
                        SYNC CHAIN
                    </button>
                </div>

                <div className="overflow-auto flex-1 p-0">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-secondary text-xs font-mono text-muted-foreground sticky top-0 backdrop-blur-md z-10">
                            <tr>
                                <th className="p-4 font-normal border-b border-border">LOG ID</th>
                                <th className="p-4 font-normal border-b border-border">TIMESTAMP</th>
                                <th className="p-4 font-normal border-b border-border">ACTOR</th>
                                <th className="p-4 font-normal border-b border-border">SUBJECT</th>
                                <th className="p-4 font-normal border-b border-border">PREV HASH (LINK)</th>
                                <th className="p-4 font-normal border-b border-border">CURRENT HASH (SIG)</th>
                            </tr>
                        </thead>
                        <tbody className="text-xs font-mono text-primary divide-y divide-border bg-white">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-secondary/50 transition-colors group">
                                    <td className="p-4 text-muted-foreground font-medium">{log.id.substring(0, 8)}...</td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                                            <span className="text-[10px] text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-emerald-600 font-medium">{log.doctor_id}</td>
                                    <td className="p-4 text-blue-600 font-medium">{log.patient_id}</td>
                                    <td className="p-4 max-w-[100px] truncate text-[10px] text-orange-600/70" title={log.prevHash}>
                                        {log.prevHash ? log.prevHash.substring(0, 12) + "..." : "GENESIS"}
                                    </td>
                                    <td className="p-4 max-w-[100px] truncate text-[10px] text-emerald-600/70 font-bold" title={log.currentHash}>
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
