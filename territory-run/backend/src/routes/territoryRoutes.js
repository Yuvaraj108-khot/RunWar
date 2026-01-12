import express from 'express';
import { getTerritoriesInView } from '../controllers/territoryController.js';
import { authRequired } from '../utils/authMiddleware.js';

const router = express.Router();

router.get('/', authRequired, getTerritoriesInView);

export default router;
