"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import Peer, { DataConnection } from "peerjs";
import { v4 as uuidv4 } from "uuid";

type ConnectionState = "DISCONNECTED" | "CONNECTING" | "CONNECTED";

interface ShardPacket {
    id: string;
    total: number;
    index: number;
    data: string; // Encrypted string
    timestamp: number;
}

interface PeerContextType {
    peer: Peer | null;
    myId: string;
    connections: DataConnection[];
    connectionState: ConnectionState;
    connectToPeer: (peerId: string, role: "DOCTOR" | "PATIENT") => void;
    breakGlass: (targetId: string, medicalData: any) => void;
    getNearbyPeers: () => Promise<string[]>;
    receivedShards: ShardPacket[];
    isOnline: boolean;
}

const PeerContext = createContext<PeerContextType | undefined>(undefined);

export const PeerProvider = ({ children }: { children: ReactNode }) => {
    const [peer, setPeer] = useState<Peer | null>(null);
    const [myId, setMyId] = useState<string>("");
    const [connections, setConnections] = useState<DataConnection[]>([]);
    const [connectionState, setConnectionState] = useState<ConnectionState>("DISCONNECTED");
    const [isOnline, setIsOnline] = useState(false);
    const [receivedShards, setReceivedShards] = useState<ShardPacket[]>([]);

    const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

    // Helper: Handle incoming connection setup
    const handleConnection = (conn: DataConnection) => {
        setConnectionState("CONNECTING");

        conn.on("open", () => {
            console.log("Connection established with:", conn.peer);
            setConnectionState("CONNECTED");
            setConnections((prev) => {
                if (!prev.find((c) => c.peer === conn.peer)) {
                    return [...prev, conn];
                }
                return prev;
            });
        });

        conn.on("data", (data: any) => {
            console.log("Received data Packet:", data);
            if (data && data.type === 'SHARD') {
                const shard = data.payload as ShardPacket;
                setReceivedShards((prev) => [...prev, shard]);
                console.log(`Received Shard ${shard.index + 1}/${shard.total}`);
            }
        });

        conn.on("close", () => {
            console.log("Connection closed:", conn.peer);
            setConnections((prev) => prev.filter((c) => c.peer !== conn.peer));
            if (connections.length <= 1) setConnectionState("DISCONNECTED");
        });

        conn.on("error", (err) => {
            console.error("Connection error:", err);
            setConnectionState("DISCONNECTED");
        });
    };

    // Initialize PeerJS
    useEffect(() => {
        // Generate session ID to prevent collisions on reload
        let id = sessionStorage.getItem("neural-pulse-session-id");
        if (!id) {
            id = uuidv4();
            sessionStorage.setItem("neural-pulse-session-id", id);
        }
        setMyId(id);

        // Use PeerJS Cloud Server for demo simplicity since we removed the custom server.js
        // In a real production mesh, we would run our own PeerServer
        const newPeer = new Peer(id, {
            debug: 1,
        });

        setConnectionState("CONNECTING");

        newPeer.on("open", (id) => {
            console.log("My Peer ID is: " + id);
            setIsOnline(true);
            setConnectionState("DISCONNECTED");

            // Mock Discovery Register
            const registerPeer = () => {
                const existingParams = localStorage.getItem("neural-pulse-peers");
                const peers = existingParams ? JSON.parse(existingParams) : {};
                peers[id] = { lastSeen: Date.now() };
                const now = Date.now();
                Object.keys(peers).forEach(key => {
                    if (now - peers[key].lastSeen > 10000) delete peers[key];
                });
                localStorage.setItem("neural-pulse-peers", JSON.stringify(peers));
            };
            registerPeer();
            heartbeatRef.current = setInterval(registerPeer, 2000);
        });

        newPeer.on("connection", (conn) => {
            console.log("Incoming connection from:", conn.peer);
            if (conn.metadata && (conn.metadata.role === 'DOCTOR' || conn.metadata.role === 'PATIENT')) {
                handleConnection(conn);
            } else {
                conn.close();
            }
        });

        newPeer.on("disconnected", () => {
            console.log("Peer disconnected. Reconnecting...");
            setIsOnline(false);
            setConnectionState("DISCONNECTED");
            if (!newPeer.destroyed) {
                setTimeout(() => {
                    if (!newPeer.destroyed) newPeer.reconnect();
                }, 3000);
            }
        });

        newPeer.on("error", (err) => {
            console.error("Peer error:", err);
            if (err.type === 'peer-unavailable') {
                // Ignore
            } else if (err.type === 'network' || err.type === 'disconnected') {
                setIsOnline(false);
                setConnectionState("DISCONNECTED");
                if (!newPeer.destroyed) setTimeout(() => newPeer.reconnect(), 3000);
            } else if (err.type === 'unavailable-id') {
                // Critical collision handling
                const newId = uuidv4();
                sessionStorage.setItem("neural-pulse-session-id", newId);
                window.location.reload();
            }
        });

        setPeer(newPeer);

        return () => {
            if (heartbeatRef.current) clearInterval(heartbeatRef.current);
            newPeer.destroy();
        };
    }, []); // Run once on mount

    const connectToPeer = (peerId: string, role: "DOCTOR" | "PATIENT") => {
        if (!peer) {
            console.warn("Peer not initialized");
            return;
        }
        console.log(`Connecting to ${peerId} as ${role}`);
        const conn = peer.connect(peerId, {
            metadata: { role: role, timestamp: Date.now() }
        });
        if (conn) handleConnection(conn);
    };

    const breakGlass = (targetId: string, medicalData: any) => {
        const conn = connections.find(c => c.peer === targetId);
        if (!conn || !conn.open) return;

        const payloadString = JSON.stringify(medicalData);
        const encrypted = btoa(payloadString);
        const totalShards = 10;
        const shardSize = Math.ceil(encrypted.length / totalShards);

        for (let i = 0; i < totalShards; i++) {
            const start = i * shardSize;
            const end = Math.min(start + shardSize, encrypted.length);
            const chunk = encrypted.slice(start, end);

            const shard: ShardPacket = {
                id: uuidv4(),
                total: totalShards,
                index: i,
                data: chunk,
                timestamp: Date.now()
            };

            conn.send({ type: 'SHARD', payload: shard });
        }
    };

    const getNearbyPeers = async () => {
        // Deprecated: Discovery is now handled by Next.js Server Actions (getVisiblePatients)
        // This function exists only to satisfy the interface until refactored
        return [];
    };

    return (
        <PeerContext.Provider value={{ peer, myId, connections, connectionState, connectToPeer, breakGlass, getNearbyPeers, receivedShards, isOnline }}>
            {children}
        </PeerContext.Provider>
    );
};

export const usePeer = () => {
    const context = useContext(PeerContext);
    if (context === undefined) {
        throw new Error("usePeer must be used within a PeerProvider");
    }
    return context;
};
