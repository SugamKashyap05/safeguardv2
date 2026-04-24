import prisma from '../config/prisma';
import { gamificationService } from './gamification.service';
import { socketService } from './websocket.service';

export interface ShopItem {
    id: string;
    type: 'hat' | 'glasses' | 'skin' | 'background';
    name: string;
    price: number;
    icon: string;
}

const SHOP_ITEMS: ShopItem[] = [
    { id: 'hat_cowboy', type: 'hat', name: 'Cowboy Hat', price: 50, icon: '🤠' },
    { id: 'hat_cap', type: 'hat', name: 'Blue Cap', price: 30, icon: '🧢' },
    { id: 'hat_crown', type: 'hat', name: 'Royal Crown', price: 100, icon: '👑' },
    { id: 'glasses_cool', type: 'glasses', name: 'Cool Shades', price: 40, icon: '😎' },
    { id: 'glasses_nerd', type: 'glasses', name: 'Smart Specs', price: 25, icon: '🤓' },
    { id: 'skin_panda', type: 'skin', name: 'Panda', price: 0, icon: '🐼' },
    { id: 'skin_tiger', type: 'skin', name: 'Tiger', price: 200, icon: '🐯' },
    { id: 'skin_fox', type: 'skin', name: 'Fox', price: 150, icon: '🦊' },
];

export class ShopService {

    getShopItems(): ShopItem[] {
        return SHOP_ITEMS;
    }

    async getInventory(childId: string): Promise<string[]> {
        const rows = await prisma.childInventory.findMany({
            where: { childId },
            select: { itemId: true },
        });
        const unlocks = rows.map(r => r.itemId);
        return ['skin_panda', ...unlocks];
    }

    async buyItem(childId: string, itemId: string) {
        const item = SHOP_ITEMS.find(i => i.id === itemId);
        if (!item) throw new Error('Item not found');

        // Use a transaction to atomically deduct stars + grant item
        await prisma.$transaction(async (tx) => {
            const child = await tx.child.findUnique({
                where: { id: childId },
                select: { stars: true },
            });
            if (!child) throw new Error('Child not found');
            if (child.stars < item.price) throw new Error('Not enough stars');

            await tx.child.update({
                where: { id: childId },
                data: { stars: { decrement: item.price } },
            });

            await tx.childInventory.create({
                data: { childId, itemId, itemType: item.type },
            });
        });

        const updated = await prisma.child.findUnique({
            where: { id: childId },
            select: { stars: true },
        });
        const newBalance = updated?.stars ?? 0;

        socketService.emitToChild(childId, 'shop:inventory_updated', { itemId, itemType: item.type });
        socketService.emitToChild(childId, 'gamification:stars_updated', { stars: newBalance });

        return { success: true, newBalance };
    }

    async saveAvatarConfig(childId: string, config: any) {
        await prisma.child.update({
            where: { id: childId },
            data: { avatarConfig: config },
        });
        socketService.emitToChild(childId, 'shop:avatar_updated', { config });
        return { success: true };
    }
}

export const shopService = new ShopService();
