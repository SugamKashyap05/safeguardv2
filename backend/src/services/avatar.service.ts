import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';
import { HTTP_STATUS } from '../utils/httpStatus';

export class AvatarService {

    async getConfig(childId: string) {
        const child = await prisma.child.findUnique({
            where: { id: childId },
            select: { avatar: true, avatarConfig: true },
        });
        if (!child) throw new AppError('Child not found', HTTP_STATUS.NOT_FOUND);
        return { avatar: child.avatar, avatarConfig: child.avatarConfig };
    }

    async updateConfig(childId: string, updates: {
        avatar?: string;
        avatarConfig?: any;
    }) {
        return prisma.child.update({
            where: { id: childId },
            data: updates,
            select: { avatar: true, avatarConfig: true },
        });
    }

    async applyAvatar(childId: string, avatarId: string) {
        return prisma.child.update({
            where: { id: childId },
            data: { avatar: avatarId },
            select: { id: true, avatar: true },
        });
    }
}
