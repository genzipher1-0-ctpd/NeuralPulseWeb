"use client";

import { usePeer } from "../context/PeerContext";
import { Activity, Wifi, WifiOff, Globe, Users } from "lucide-react";

export default function MeshStatus() {
    const { myId, isOnline, connections, connectionState } = usePeer();

    let statusColor = "text-muted-foreground";
    if (connectionState === "CONNECTED") statusColor = "text-emerald-400";
    if (connectionState === "CONNECTING") statusColor = "text-yellow-400";

    return (
        <div className="fixed bottom-0 left-0 w-full bg-black/80 backdrop-blur-md border-t border-white/10 p-3 z-50">
            <div className="max-w-4xl mx-auto flex items-center justify-between text-xs font-mono">

                {/* Connection Status */}
                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 ${isOnline ? "text-emerald-400" : "text-rose-500"}`}>
                        {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4 animate-pulse" />}
                        <span className="hidden sm:inline">{isOnline ? "MESH ONLINE" : "OFFLINE"}</span>
                    </div>
                    <div className="h-4 w-[1px] bg-white/20" />
                    <div className={`flex items-center gap-2 ${statusColor}`}>
                        <Activity className="w-4 h-4" />
                        <span>{connectionState}</span>
                    </div>
                    <div className="h-4 w-[1px] bg-white/20" />
                    <div className="flex items-center gap-2 text-primary">
                        <Globe className="w-4 h-4" />
                        <span className="max-w-[100px] truncate" title={myId}>{myId || "Initializing..."}</span>
                    </div>
                </div>

                {/* Peer Count */}
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{connections.length} PEERS</span>
                </div>

                {/* Activity Indicator */}
                <div className="flex items-center gap-2">
                    <Activity className={`w-4 h-4 ${isOnline ? "text-secondary animate-pulse" : "text-muted-foreground"}`} />
                    <span className="hidden sm:inline text-muted-foreground">PULSE</span>
                </div>

            </div>
        </div>
    );
}
