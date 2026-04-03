import { redis } from '../config/redis';
import { Job } from '../types/job.types';

export async function enqueueJob(job: Job): Promise<void> {
  try {
    await redis.hset(`job:${job.id}`, {
      status: 'queued',
      task: job.task,
      value: String(job.value),
      createdAt: String(job.createdAt),
    });
    await redis.lpush('job_queue', JSON.stringify(job));
    await redis.incr('total_jobs_submitted');
  } catch (err) {
    console.error(`failed to enqueue job ${job.id}`, err);
    throw new Error('failed to enqueue job');
  }
}

export async function getJobStatus(id: string): Promise<Record<string, string>> {
  try {
    return await redis.hgetall(`job:${id}`);
  } catch (err) {
    console.error(`failed to fetch job status for ${id}`, err);
    throw new Error('failed to fetch job status');
  }
}

export async function isJobExist(id: string): Promise<boolean> {
  try {
    const data = await getJobStatus(id);
    return Object.keys(data).length > 0;
  } catch (err) {
    console.error(`failed to determine whether job ${id} exists`, err);
    throw new Error('failed to determine job existence');
  }
}
