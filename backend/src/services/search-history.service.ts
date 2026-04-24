import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';
import { HTTP_STATUS } from '../utils/httpStatus';

export class SearchHistoryService {

    async record(childId: string, query: string) {
        if (!query.trim()) return;

        // Update existing or create new
        const existing = await prisma.searchHistory.findFirst({
            where: { childId, query: { equals: query, mode: 'insensitive' } },
        });

        if (existing) {
            return prisma.searchHistory.update({
                where: { id: existing.id },
                data: { count: { increment: 1 }, lastSearchedAt: new Date() },
            });
        }

        return prisma.searchHistory.create({
            data: { childId, query },
        });
    }

    async getHistory(childId: string, limit = 10) {
        return prisma.searchHistory.findMany({
            where: { childId },
            orderBy: [{ lastSearchedAt: 'desc' }],
            take: limit,
            select: { id: true, query: true, count: true, lastSearchedAt: true },
        });
    }

    async clearHistory(childId: string) {
        await prisma.searchHistory.deleteMany({ where: { childId } });
        return { success: true };
    }

    async deleteEntry(childId: string, entryId: string) {
        const entry = await prisma.searchHistory.findFirst({
            where: { id: entryId, childId },
        });
        if (!entry) throw new AppError('Search entry not found', HTTP_STATUS.NOT_FOUND);

        await prisma.searchHistory.delete({ where: { id: entryId } });
        return { success: true };
    }
}
