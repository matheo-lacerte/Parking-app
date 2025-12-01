import { Router } from 'express';
import { getObservationsByDate } from '../controllers/signalController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.get('/byDate', authMiddleware, getObservationsByDate);


export default router;
