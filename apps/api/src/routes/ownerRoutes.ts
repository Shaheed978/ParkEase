import { Router } from 'express';
import { getOwnerDashboard, createFacility, bulkGenerateSlots } from '../controllers/ownerController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate as any);
router.use(authorize(['OWNER', 'ADMIN']) as any);

router.get('/dashboard', getOwnerDashboard as any);
router.post('/facility', createFacility as any);
router.post('/facility/:facilityId/slots/bulk', bulkGenerateSlots as any);

export default router;
