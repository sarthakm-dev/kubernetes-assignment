import { Router } from 'express';
import { submit, status, metrics } from './controllers/job-controller';

const router = Router();

router.post('/submit', submit);
router.get('/status/:id', status);
router.get('/metrics', metrics);

export default router;
