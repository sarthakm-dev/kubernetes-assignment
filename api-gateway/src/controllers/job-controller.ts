import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import client from 'prom-client';
import { enqueueJob, getJobStatus, isJobExist } from '../services/job-service';
import { JobPayload } from '../types/job.types';
import { totalJobsSubmitted } from '../config/prom-config';

export async function submit(req: Request, res: Response): Promise<void> {
  try {
    const id = randomUUID();
    const { task = 'fibonacci', value = 35 } = req.body as JobPayload;

    await enqueueJob({ id, task, value, createdAt: Date.now() });
    totalJobsSubmitted.inc();

    res.status(202).json({ id, message: 'job queued' });
  } catch (err) {
    console.error('submit error', err);
    res.status(500).json({ error: 'failed to submit job' });
  }
}

export async function status(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    if (!(await isJobExist(id))) {
      res.status(404).json({ error: 'job not found' });
      return;
    }

    const data = await getJobStatus(id);
    res.json(data);
  } catch (err) {
    console.error('status error', err);
    res.status(500).json({ error: 'failed to fetch status' });
  }
}

export async function metrics(_req: Request, res: Response): Promise<void> {
  try {
    res.set('Content-Type', client.register.contentType);
    res.send(await client.register.metrics());
  } catch (err) {
    console.error('metrics error', err);
    res.status(500).json({ error: 'failed to fetch metrics' });
  }
}
