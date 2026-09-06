import { Router } from 'express';
import { updateProfile, getVehicles, addVehicle, deleteVehicle } from '../controllers/userController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate as any);

router.put('/profile', updateProfile as any);
router.get('/vehicles', getVehicles as any);
router.post('/vehicles', addVehicle as any);
router.delete('/vehicles/:id', deleteVehicle as any);

export default router;
