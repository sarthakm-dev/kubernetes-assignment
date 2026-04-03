import { Router } from 'express';
import { stats, metrics } from './controllers/stats-controller';

const router = Router();

router.get('/stats', stats);
router.get('/metrics', metrics);

export default router;
