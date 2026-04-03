import { Request, Response } from 'express';
import client from 'prom-client';
import { getQueueLength, getTotalJobsCompleted } from '../services/worker-service';
import {
  jobErrors,
  jobProcessingTime,
  jobsProcessed,
  totalJobsCompleted,
  totalQueueLength,
} from '../config/prom-client';

client.collectDefaultMetrics({ register: client.register });

export async function getMetrics(_req: Request, res: Response): Promise<void> {
  try {
    const completed = await getTotalJobsCompleted();
    const qlen = await getQueueLength();
    totalJobsCompleted.set(completed);
    totalQueueLength.set(qlen);

    res.set('Content-Type', client.register.contentType);
    res.send(await client.register.metrics());
  } catch (err) {
    console.error('worker metrics error', err);
    res.status(500).json({ error: 'failed to fetch worker metrics' });
  }
}

export function getHealth(_req: Request, res: Response): void {
  res.status(200).send('ok');
}

export function markJobProcessed(durationSeconds: number): void {
  jobsProcessed.inc();
  jobProcessingTime.observe(durationSeconds);
}

export function markJobError(): void {
  jobErrors.inc();
}
