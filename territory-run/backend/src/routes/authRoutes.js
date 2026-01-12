import express from 'express';
import { register, login, listUsers } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/debug/users', listUsers);

export default router;
