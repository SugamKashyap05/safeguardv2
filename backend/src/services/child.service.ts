import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';
import { HTTP_STATUS } from '../utils/httpStatus';
import bcrypt from 'bcryptjs';

const MAX_CHILDREN: Record<string, number> = {
    free: 2,
    premium: 5,
    family: 10,
};

export class ChildService {

    async getChildren(parentId: string) {
        return prisma.child.findMany({
            where: { parentId },
            orderBy: { createdAt: 'asc' },
        });
    }

    async getChild(childId: string, parentId: string) {
        const child = await prisma.child.findFirst({
            where: { id: childId, parentId },
        });
        if (!child) throw new AppError('Child not found', HTTP_STATUS.NOT_FOUND);
        return child;
    }

    async createChild(parentId: string, data: {
        name: string;
        age: number;
        avatar?: string;
        pin: string;
    }) {
        // Check subscription tier limit
        const parent = await prisma.parent.findUnique({
            where: { id: parentId },
            select: { subscriptionTier: true },
        });
        if (!parent) throw new AppError('Parent not found', HTTP_STATUS.NOT_FOUND);

        const childCount = await prisma.child.count({
            where: { parentId, isActive: true },
        });

        const maxAllowed = MAX_CHILDREN[parent.subscriptionTier] ?? 2;
        if (childCount >= maxAllowed) {
            throw new AppError(
                `Child limit reached for ${parent.subscriptionTier} plan (max ${maxAllowed})`,
                HTTP_STATUS.FORBIDDEN,
            );
        }

        // Derive age level
        const ageAppropriateLevel = this.deriveAgeLevel(data.age);

        // Hash PIN
        const pinHash = await bcrypt.hash(data.pin, 10);

        const child = await prisma.child.create({
            data: {
                parentId,
                name: data.name,
                age: data.age,
                avatar: data.avatar,
                pinHash,
                ageAppropriateLevel,
            },
        });

        // Create default screen time rules
        await prisma.screenTimeRule.create({
            data: { childId: child.id },
        });

        return child;
    }

    async updateChild(childId: string, parentId: string, updates: {
        name?: string;
        age?: number;
        avatar?: string;
        avatarConfig?: any;
        preferences?: any;
    }) {
        const child = await prisma.child.findFirst({ where: { id: childId, parentId } });
        if (!child) throw new AppError('Child not found', HTTP_STATUS.NOT_FOUND);

        const data: any = { ...updates };
        if (updates.age) {
            data.ageAppropriateLevel = this.deriveAgeLevel(updates.age);
        }

        return prisma.child.update({ where: { id: childId }, data });
    }

    async deleteChild(childId: string, parentId: string) {
        const child = await prisma.child.findFirst({ where: { id: childId, parentId } });
        if (!child) throw new AppError('Child not found', HTTP_STATUS.NOT_FOUND);

        await prisma.child.update({
            where: { id: childId },
            data: { isActive: false },
        });
        return { success: true };
    }

    async verifyPin(childId: string, pin: string) {
        const child = await prisma.child.findUnique({
            where: { id: childId },
            select: { pinHash: true, isActive: true },
        });
        if (!child) throw new AppError('Child not found', HTTP_STATUS.NOT_FOUND);
        if (!child.isActive) throw new AppError('Child account is paused', HTTP_STATUS.FORBIDDEN);

        return bcrypt.compare(pin, child.pinHash);
    }

    async updatePin(childId: string, parentId: string, newPin: string) {
        const child = await prisma.child.findFirst({ where: { id: childId, parentId } });
        if (!child) throw new AppError('Child not found', HTTP_STATUS.NOT_FOUND);

        const pinHash = await bcrypt.hash(newPin, 10);
        await prisma.child.update({ where: { id: childId }, data: { pinHash } });
        return { success: true };
    }

    private deriveAgeLevel(age: number): string {
        if (age >= 3 && age <= 5) return 'preschool';
        if (age >= 6 && age <= 7) return 'early-elementary';
        if (age >= 8 && age <= 10) return 'elementary';
        if (age >= 11 && age <= 13) return 'tweens';
        return 'teens';
    }
}
