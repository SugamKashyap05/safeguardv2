
import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { supabase } from '../config/supabase';

interface SocketUser {
    id: string;
    role: 'parent' | 'child';
    childId?: string; // If role is child
}

export class WebSocketService {
    private io: Server;

    constructor(server: HttpServer) {
        this.io = new Server(server, {
            cors: {
                origin: env.CORS_ORIGIN,
                methods: ['GET', 'POST'],
                credentials: true
            }
        });

        this.initializeMiddlewares();
        this.initializeEvents();
    }

    private initializeMiddlewares() {
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                if (!token) return next(new Error('Authentication error'));

                // Verify with Supabase (or verify locally if you share the secret)
                // Since Supabase JWT secret is usually available, we can verify locally for speed.
                // Or call Supabase auth.getUser(token)
                const { data: { user }, error } = await supabase.auth.getUser(token);

                if (error || !user) {
                    // Check if it's a child session (custom token)
                    try {
                        // Decode assuming it might be our custom child token signed with JWT_SECRET
                        const decoded = jwt.verify(token, env.JWT_SECRET) as any;
                        if (decoded && decoded.childId) {
                            socket.data.user = { id: decoded.childId, role: 'child', childId: decoded.childId };
                            return next();
                        }
                    } catch (e) {
                        // ignore
                    }
                    return next(new Error('Authentication error'));
                }

                socket.data.user = { id: user.id, role: 'parent' };
                next();
            } catch (err) {
                next(new Error('Authentication error'));
            }
        });
    }

    private initializeEvents() {
        this.io.on('connection', (socket: Socket) => {
            console.log(`Socket connected: ${socket.id} (User: ${socket.data.user?.id})`);
            const user = socket.data.user as SocketUser;

            if (user.role === 'child' && user.childId) {
                socket.join(`child_${user.childId}`);
                console.log(`Socket joined channel: child_${user.childId}`);

                // Handle device registration/handshake if needed
                socket.on('register_device', (deviceInfo) => {
                    // Potentially update device status to active
                    console.log('Device registered via socket', deviceInfo);
                });

                // Watch Progress Update
                socket.on('watch_progress', (data) => {
                    // Broadcast to other devices of same child
                    socket.to(`child_${user.childId}`).emit('watch_progress_update', {
                        ...data,
                        senderDeviceId: socket.id // or device ID passed in data
                    });
                });

                // Join specific device room if provided in handshake query?
                // For now, simple child room.
            }

            if (user.role === 'parent') {
                // Parent logic - maybe join all their children's rooms?
            }

            socket.on('disconnect', () => {
                console.log(`Socket disconnected: ${socket.id}`);
            });
        });
    }

    // Public method to emit events from controllers/services
    public emitToChild(childId: string, event: string, data: any) {
        this.io.to(`child_${childId}`).emit(event, data);
    }

    public emitToDevice(deviceId: string, event: string, data: any) {
        // If we track socket IDs per device, we can use that.
        // For now, we might broadcast to child room with a targetDeviceId field
        // Or we can rely on clients filtering.
        // Ideal: Map deviceId -> socketId
    }
}
