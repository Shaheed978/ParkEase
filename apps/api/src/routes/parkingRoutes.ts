import { Router } from 'express';
import { searchParking, getFacilityDetails } from '../controllers/parkingController';

const router = Router();

router.get('/search', searchParking);
router.get('/:id', getFacilityDetails);

export default router;
