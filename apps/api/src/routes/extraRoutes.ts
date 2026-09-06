import { Router } from 'express';
import {
  addReview,
  toggleFavorite,
  getFavorites,
  getNotifications,
  markNotificationsRead,
  createTicket,
} from '../controllers/extraController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate as any);

router.post('/reviews', addReview as any);
router.post('/favorites/toggle', toggleFavorite as any);
router.get('/favorites', getFavorites as any);
router.get('/notifications', getNotifications as any);
router.post('/notifications/read', markNotificationsRead as any);
router.post('/tickets', createTicket as any);

export default router;
