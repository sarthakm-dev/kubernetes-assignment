import { Router } from 'express';
import { getMetrics, getHealth } from './controllers/worker-controller';

const router = Router();

router.get('/metrics', getMetrics);
router.get('/health', getHealth);

export default router;
