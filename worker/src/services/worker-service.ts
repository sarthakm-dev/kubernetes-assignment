import Redis from 'ioredis';
import { Job } from '../types/job.types';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
});

const queueRedis = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
});

export async function setJobProcessing(id: string, startedAt: number): Promise<void> {
  try {
    await redis.hset(`job:${id}`, 'status', 'processing', 'startedAt', String(startedAt));
  } catch (err) {
    console.error(`failed to mark job ${id} as processing`, err);
    throw new Error('failed to update job processing state');
  }
}

export async function setJobCompleted(
  job: Job,
  result: string | number,
  durationSeconds: number
): Promise<void> {
  try {
    await redis.incr('total_jobs_completed');
    await redis.hset(`job:${job.id}`, {
      status: 'completed',
      result: String(result),
      completedAt: String(Date.now()),
      durationSeconds: String(durationSeconds),
    });
  } catch (err) {
    console.error(`failed to mark job ${job.id} as completed`, err);
    throw new Error('failed to update completed job state');
  }
}

export async function setJobError(job: Job, errorMessage: string): Promise<void> {
  try {
    await redis.hset(`job:${job.id}`, 'status', 'error', 'errorMessage', errorMessage);
  } catch (err) {
    console.error(`failed to mark job ${job.id} as errored`, err);
    throw new Error('failed to update errored job state');
  }
}

export async function getTotalJobsCompleted(): Promise<number> {
  try {
    return Number((await redis.get('total_jobs_completed')) || 0);
  } catch (err) {
    console.error('failed to fetch total jobs completed', err);
    throw new Error('failed to fetch completed jobs total');
  }
}

export async function getQueueLength(): Promise<number> {
  try {
    return await redis.llen('job_queue');
  } catch (err) {
    console.error('failed to fetch worker queue length', err);
    throw new Error('failed to fetch worker queue length');
  }
}

export async function popJob(timeoutSecs = 5): Promise<[string, string] | null> {
  try {
    return await queueRedis.brpop('job_queue', timeoutSecs);
  } catch (err) {
    console.error('failed to pop job from queue', err);
    throw new Error('failed to pop job from queue');
  }
}
