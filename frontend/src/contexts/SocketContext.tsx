
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    emit: (event: string, data: any) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
    children: React.ReactNode;
    token?: string; // Optional: Auth token (parent or child)
    role?: 'parent' | 'child'; // To differentiate auth strategy if needed
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children, token, role }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!token) return;

        // Backend URL (assumed port 5000 or env var)
        // In Vite, use import.meta.env.VITE_API_URL
        const startSocket = () => {
            const newSocket = io('http://localhost:5000', {
                auth: { token, role },
                transports: ['websocket'],
                reconnection: true
            });

            newSocket.on('connect', () => {
                console.log('Socket connected');
                setIsConnected(true);
            });

            newSocket.on('disconnect', () => {
                console.log('Socket disconnected');
                setIsConnected(false);
            });

            newSocket.on('connect_error', (err) => {
                console.error('Socket connect error', err);
            });

            setSocket(newSocket);
            return newSocket;
        };

        const s = startSocket();

        return () => {
            s.disconnect();
        };
    }, [token]);

    const emit = (event: string, data: any) => {
        if (socket) {
            socket.emit(event, data);
        }
    };

    return (
        <SocketContext.Provider value={{ socket, isConnected, emit }}>
            {children}
        </SocketContext.Provider>
    );
};
