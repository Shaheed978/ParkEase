import { Router } from 'express';
import {
  holdSlot,
  calculatePrice,
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  operatorCheckIn,
  operatorCheckOut,
} from '../controllers/bookingController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate as any);

router.post('/hold-slot', holdSlot as any);
router.post('/calculate', calculatePrice as any);
router.post('/', createBooking as any);
router.get('/my', getMyBookings as any);
router.get('/:id', getBookingById as any);
router.post('/:id/cancel', cancelBooking as any);

// Operator Gate APIs
router.post('/operator/check-in', operatorCheckIn as any);
router.post('/operator/check-out', operatorCheckOut as any);

export default router;
