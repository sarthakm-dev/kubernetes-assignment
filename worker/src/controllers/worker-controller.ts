import { Request, Response } from 'express';
import client from 'prom-client';
import { getQueueLength, getTotalJobsCompleted } from '../services/worker-service';

const jobsProcessed = new client.Counter({
  name: 'jobs_processed_total',
  help: 'Total number of jobs processed',
});

const jobErrors = new client.Counter({
  name: 'job_errors_total',
  help: 'Total number of job errors',
});

const jobProcessingTime = new client.Histogram({
  name: 'job_processing_time_seconds',
  help: 'Job processing time in seconds',
  buckets: [0.1, 0.5, 1, 2, 3, 5, 10],
});

const totalJobsCompleted = new client.Gauge({
  name: 'total_jobs_completed',
  help: 'Total jobs completed across workers',
});

const totalQueueLength = new client.Gauge({
  name: 'queue_length',
  help: 'Current queue length',
});

export async function getMetrics(_req: Request, res: Response): Promise<void> {
  const completed = await getTotalJobsCompleted();
  const qlen = await getQueueLength();
  totalJobsCompleted.set(completed);
  totalQueueLength.set(qlen);

  res.set('Content-Type', client.register.contentType);
  res.send(await client.register.metrics());
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
