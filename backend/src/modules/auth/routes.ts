import { Router } from 'express';
import { register, login, updatePushToken } from './controllers/authController';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.put('/pushToken', updatePushToken)

export default router;