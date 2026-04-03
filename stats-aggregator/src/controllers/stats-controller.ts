import { Request, Response } from 'express';
import client from 'prom-client';
import {
  getSubmitted,
  getCompleted,
  getQueueLength,
  getAverageJobTimeSeconds,
} from '../services/stats-service';

import {
  queueLengthGauge,
  totalJobsCompletedGauge,
  totalJobsSubmittedGauge,
} from '../config/prom-config';

export async function stats(_req: Request, res: Response): Promise<void> {
  try {
    const submitted = await getSubmitted();
    const completed = await getCompleted();
    const qlen = await getQueueLength();
    const avg = await getAverageJobTimeSeconds();

    res.json({
      total_jobs_submitted: submitted,
      total_jobs_completed: completed,
      queue_length: qlen,
      avg_job_time_seconds: avg,
    });
  } catch (err) {
    console.error('stats error', err);
    res.status(500).json({ error: 'could not get stats' });
  }
}

export async function metrics(_req: Request, res: Response): Promise<void> {
  try {
    const submitted = await getSubmitted();
    const completed = await getCompleted();
    const qlen = await getQueueLength();

    totalJobsSubmittedGauge.set(submitted);
    totalJobsCompletedGauge.set(completed);
    queueLengthGauge.set(qlen);

    res.set('Content-Type', client.register.contentType);
    res.send(await client.register.metrics());
  } catch (err) {
    console.error('metrics error', err);
    res.status(500).json({ error: 'could not get metrics' });
  }
}
