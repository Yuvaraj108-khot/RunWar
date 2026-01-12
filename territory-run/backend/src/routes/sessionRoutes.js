import express from 'express';
import {
  postStartSession,
  postLocation,
  postEndSession
} from '../controllers/sessionController.js';
import { authRequired } from '../utils/authMiddleware.js';

const router = express.Router();

router.post('/start', authRequired, postStartSession);
router.post('/location', authRequired, postLocation);
router.post('/end', authRequired, postEndSession);

export default router;
 