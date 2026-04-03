import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
});

export async function getSubmitted(): Promise<number> {
  return Number((await redis.get('total_jobs_submitted')) || 0);
}

export async function getCompleted(): Promise<number> {
  return Number((await redis.get('total_jobs_completed')) || 0);
}

export async function getQueueLength(): Promise<number> {
  return await redis.llen('job_queue');
}

export async function getAverageJobTimeSeconds(): Promise<number> {
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
}
