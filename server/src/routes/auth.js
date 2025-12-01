import { Router } from 'express';
import { signup, login, logout, getProfile } from '../controllers/AuthController.js';

const router = Router();
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/getProfile', getProfile);
export default router;
