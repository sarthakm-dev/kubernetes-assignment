import { redis } from '../config/redis';

export async function getSubmitted(): Promise<number> {
  try {
    return Number((await redis.get('total_jobs_submitted')) || 0);
  } catch (err) {
    console.error('failed to fetch total jobs submitted', err);
    throw new Error('failed to fetch total jobs submitted');
  }
}

export async function getCompleted(): Promise<number> {
  try {
    return Number((await redis.get('total_jobs_completed')) || 0);
  } catch (err) {
    console.error('failed to fetch total jobs completed', err);
    throw new Error('failed to fetch total jobs completed');
  }
}

export async function getQueueLength(): Promise<number> {
  try {
    return await redis.llen('job_queue');
  } catch (err) {
    console.error('failed to fetch queue length', err);
    throw new Error('failed to fetch queue length');
  }
}

export async function getAverageJobTimeSeconds(): Promise<number> {
  try {
    const keys = await redis.keys('job:*');
    const latencies: number[] = [];

    for (const key of keys) {
      const item = await redis.hgetall(key);
      if (item.durationSeconds) {
        const value = Number(item.durationSeconds);
        if (!Number.isNaN(value)) {
          latencies.push(value);
        }
      }
    }

    return latencies.length > 0
      ? latencies.reduce((sum, value) => sum + value, 0) / latencies.length
      : 0;
  } catch (err) {
    console.error('failed to calculate average job time', err);
    throw new Error('failed to calculate average job time');
  }
}
