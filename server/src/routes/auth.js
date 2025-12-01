import { Router } from 'express';
import { signup, login, logout, getProfile } from '../controllers/AuthController.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
// Route protégée
router.get('/getProfile', authMiddleware, getProfile);
export default router;
