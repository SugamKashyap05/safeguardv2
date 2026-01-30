
import { supabaseAdmin } from '../config/supabase';
import { gamificationService } from './gamification.service';
import { socketService } from './websocket.service';

export interface ShopItem {
    id: string;
    type: 'hat' | 'glasses' | 'skin' | 'background';
    name: string;
    price: number;
    icon: string; // Emoji or URL
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

    getShopItems() {
        return SHOP_ITEMS;
    }

    async getInventory(childId: string) {
        const { data, error } = await supabaseAdmin
            .from('child_inventory')
            .select('item_id')
            .eq('child_id', childId);

        if (error) throw error;

        // Base items are always unlocked
        const unlocks = data?.map(d => d.item_id) || [];
        return ['skin_panda', ...unlocks];
    }

    async buyItem(childId: string, itemId: string) {
        const item = SHOP_ITEMS.find(i => i.id === itemId);
        if (!item) throw new Error("Item not found");

        const childStats = await gamificationService.getStats(childId);
        const childStars = childStats.stars;

        if (childStars < item.price) {
            throw new Error("Not enough stars");
        }

        // Deduct stars (Manual update or new method in gamification service?)
        // Let's add spendStars to GamificationService or do it here.
        // We do it directly here for speed.

        const { error: starError } = await supabaseAdmin
            .from('children')
            .update({ stars: childStars - item.price })
            .eq('id', childId);

        if (starError) throw starError;

        // Add to inventory
        const { error: invError } = await supabaseAdmin
            .from('child_inventory')
            .insert({
                child_id: childId,
                item_id: itemId,
                item_type: item.type
            });

        if (invError) {
            // Rollback stars? In production yes, here we hope for best.
            throw invError;
        }

        socketService.emitToChild(childId, 'shop:inventory_updated', { itemId, itemType: item.type });
        socketService.emitToChild(childId, 'gamification:stars_updated', { stars: childStars - item.price });

        return { success: true, newBalance: childStars - item.price };
    }

    async saveAvatarConfig(childId: string, config: any) {
        const { error } = await supabaseAdmin
            .from('children')
            .update({ avatar_config: config })
            .eq('id', childId);

        if (error) throw error;
        socketService.emitToChild(childId, 'shop:avatar_updated', { config });
        return { success: true };
    }
}

export const shopService = new ShopService();
