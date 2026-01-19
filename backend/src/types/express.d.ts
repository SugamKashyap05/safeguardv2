import { Parent, Child } from '../models/types';

declare global {
    namespace Express {
        interface Request {
            user?: any;
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
