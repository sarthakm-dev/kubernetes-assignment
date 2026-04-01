import Redis from 'ioredis';
import { Job } from '../types/job.types';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
});

export async function enqueueJob(job: Job): Promise<void> {
  await redis.hset(`job:${job.id}`, {
    status: 'queued',
    task: job.task,
    value: String(job.value),
    createdAt: String(job.createdAt),
  });
  await redis.lpush('job_queue', JSON.stringify(job));
  await redis.incr('total_jobs_submitted');
}

export async function getJobStatus(id: string): Promise<Record<string, string>> {
  return redis.hgetall(`job:${id}`);
}

export async function isJobExist(id: string): Promise<boolean> {
  const data = await getJobStatus(id);
  return Object.keys(data).length > 0;
}
