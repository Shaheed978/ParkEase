import { Router } from 'express';
import {
  getAdminDashboard,
  getPendingFacilities,
  updateFacilityStatus,
  getCoupons,
  createCoupon,
} from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate as any);
router.use(authorize(['ADMIN']) as any);

router.get('/dashboard', getAdminDashboard as any);
router.get('/facilities/pending', getPendingFacilities as any);
router.put('/facilities/:id/status', updateFacilityStatus as any);
router.get('/coupons', getCoupons as any);
router.post('/coupons', createCoupon as any);

export default router;
