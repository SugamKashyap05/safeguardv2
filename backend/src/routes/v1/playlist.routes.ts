import { Router } from 'express';
import { PlaylistController } from '../../controllers/playlist.controller';
import { asyncWrapper } from '../../utils/asyncWrapper';
// import { requireAuth } from '../../middleware/auth.middleware'; 

const router = Router();

// Assuming these are protected by parent or child auth in main index.ts or applied here
// router.use(requireAuth); 

// 1. Static Routes (Must function before :childId capture)
router.post('/favorite/toggle', asyncWrapper(PlaylistController.toggleFavorite));
router.get('/favorite/check', asyncWrapper(PlaylistController.checkFavorite));

// 2. Dynamic Routes
router.get('/:childId', asyncWrapper(PlaylistController.getPlaylists));
router.post('/', asyncWrapper(PlaylistController.createPlaylist));
router.get('/detail/:id', asyncWrapper(PlaylistController.getPlaylistById));
router.delete('/:id', asyncWrapper(PlaylistController.deletePlaylist));

router.post('/:id/videos', asyncWrapper(PlaylistController.addToPlaylist));
router.delete('/:id/videos/:videoId', asyncWrapper(PlaylistController.removeFromPlaylist));
router.put('/:id/reorder', asyncWrapper(PlaylistController.reorderItems));



export default router;
