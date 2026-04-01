import Redis from 'ioredis';
import { Job } from '../types/job.types';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
});

export async function setJobProcessing(id: string, startedAt: number): Promise<void> {
  await redis.hset(`job:${id}`, 'status', 'processing', 'startedAt', String(startedAt));
}

export async function setJobCompleted(
  job: Job,
  result: string | number,
  durationSeconds: number
): Promise<void> {
  await redis.incr('total_jobs_completed');
  await redis.hset(`job:${job.id}`, {
    status: 'completed',
    result: String(result),
    completedAt: String(Date.now()),
    durationSeconds: String(durationSeconds),
  });
}

export async function setJobError(job: Job, errorMessage: string): Promise<void> {
  await redis.hset(`job:${job.id}`, 'status', 'error', 'errorMessage', errorMessage);
}

export async function getTotalJobsCompleted(): Promise<number> {
  return Number((await redis.get('total_jobs_completed')) || 0);
}

export async function getQueueLength(): Promise<number> {
  return await redis.llen('job_queue');
}

export async function popJob(timeoutSecs = 5): Promise<[string, string] | null> {
  return await redis.brpop('job_queue', timeoutSecs);
}
