import { Parent, Child } from '../models/types';

declare global {
    namespace Express {
        interface Request {
            user?: any; // Supabase User
            parent?: Parent;
            child?: {
                id: string;
                name: string;
                age: number;
                parentId: string;
            };
        }
    }
}
