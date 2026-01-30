
import { Request, Response, NextFunction } from 'express';
import { shopService } from '../services/shop.service';
import { HTTP_STATUS } from '../utils/httpStatus';
import { ApiResponse } from '../utils/response';

export class ShopController {

    getItems(req: Request, res: Response) {
        const items = shopService.getShopItems();
        return ApiResponse.success(res, items);
    }

    async getInventory(req: Request, res: Response, next: NextFunction) {
        try {
            const { childId } = req.params;
            const inventory = await shopService.getInventory(childId);
            return ApiResponse.success(res, inventory);
        } catch (e) { next(e); }
    }

    async buyItem(req: Request, res: Response, next: NextFunction) {
        try {
            const { childId } = req.params;
            const { itemId } = req.body;
            const result = await shopService.buyItem(childId, itemId);
            return ApiResponse.success(res, result, "Item bought!");
        } catch (e) {
            next(e);
        }
    }

    async saveAvatar(req: Request, res: Response, next: NextFunction) {
        try {
            const { childId } = req.params;
            const { config } = req.body;
            await shopService.saveAvatarConfig(childId, config);
            return ApiResponse.success(res, null, "Avatar updated!");
        } catch (e) { next(e); }
    }
}

export const shopController = new ShopController();
