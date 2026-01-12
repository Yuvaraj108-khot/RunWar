import express from 'express';
import { getLeaderboards } from '../controllers/leaderboardController.js';
import { authRequired } from '../utils/authMiddleware.js';

const router = express.Router();

router.get('/', authRequired, getLeaderboards);

export default router;
