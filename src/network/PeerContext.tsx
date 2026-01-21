import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import Peer, { DataConnection, MediaConnection } from 'peerjs';
import { v4 as uuidv4 } from 'uuid';

interface PeerContextType {
    peerId: string;
    connections: DataConnection[];
    connectToPeer: (targetId: string) => void;
    sendMessage: (type: string, payload: any) => void;
    myStream: MediaStream | null;
    remoteStreams: { [peerId: string]: MediaStream };
    isHost: boolean;
    hostId: string | null;
    lastMessage: { type: string, payload: any } | null;
}

const PeerContext = createContext<PeerContextType | null>(null);

export const usePeer = () => {
    const context = useContext(PeerContext);
    if (!context) throw new Error("usePeer must be used within PeerProvider");
    return context;
};

export const PeerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [peerId, setPeerId] = useState<string>('');
    const [connections, setConnections] = useState<DataConnection[]>([]);
    const [myStream, setMyStream] = useState<MediaStream | null>(null);
    const [remoteStreams, setRemoteStreams] = useState<{ [id: string]: MediaStream }>({});
    const [hostId, setHostId] = useState<string | null>(null);
    const [lastMessage, setLastMessage] = useState<{ type: string, payload: any } | null>(null);

    const peerRef = useRef<Peer | null>(null);
    const connectionsRef = useRef<DataConnection[]>([]);

    // Initialize Peer
    useEffect(() => {
        const newPeerId = uuidv4().slice(0, 8); // Short ID for easier typing
        const peer = new Peer(newPeerId);

        peer.on('open', (id) => {
            console.log('My Peer ID:', id);
            setPeerId(id);
            // By default, if we are just starting, we are our own host until we connect to someone
            if (!hostId) setHostId(id);
        });

        peer.on('connection', (conn) => {
            console.log('Incoming connection from:', conn.peer);
            handleConnection(conn);
        });

        peer.on('call', (call) => {
            console.log('Incoming call from:', call.peer);
            navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
                call.answer(stream);
                call.on('stream', (remoteStream) => {
                    setRemoteStreams(prev => ({ ...prev, [call.peer]: remoteStream }));
                });
            });
        });

        peerRef.current = peer;

        // Get Local Audio
        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
            setMyStream(stream);
        }).catch(err => console.error("Failed to get local stream", err));

        return () => {
            peer.destroy();
        };
    }, []);

    const handleConnection = (conn: DataConnection) => {
        conn.on('open', () => {
            setConnections(prev => [...prev, conn]);
            connectionsRef.current.push(conn);

            console.log("Connected to", conn.peer);
        });

        conn.on('data', (data: any) => {
            console.log("Received data", data);
            handleData(data, conn.peer);
        });

        conn.on('close', () => {
            console.log("Connection closed:", conn.peer);
            setConnections(prev => prev.filter(c => c.peer !== conn.peer));
            setRemoteStreams(prev => {
                const newStreams = { ...prev };
                delete newStreams[conn.peer];
                return newStreams;
            });
        });
    };

    const handleData = (data: any, senderId: string) => {
        setLastMessage(data);
        // Protocol: { type: string, payload: any }
        if (data.type === 'WELCOME') {
            // If we joined someone, they are the host
            setHostId(senderId);
        }
    };

    const connectToPeer = (targetId: string) => {
        if (!peerRef.current) return;
        const conn = peerRef.current.connect(targetId);
        handleConnection(conn);

        // Also call for audio
        if (myStream) {
            const call = peerRef.current.call(targetId, myStream);
            call.on('stream', (remoteStream) => {
                setRemoteStreams(prev => ({ ...prev, [targetId]: remoteStream }));
            });
        }
    };

    const sendMessage = (type: string, payload: any) => {
        connections.forEach(conn => {
            if (conn.open) {
                conn.send({ type, payload });
            }
        });
    };

    const isHost = hostId === peerId;

    return (
        <PeerContext.Provider value={{
            peerId,
            connections,
            connectToPeer,
            sendMessage,
            myStream,
            remoteStreams,
            isHost,
            hostId,
            lastMessage
        }}>
            {children}
        </PeerContext.Provider>
    );
};
