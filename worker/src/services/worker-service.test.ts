import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Job } from '../types/job.types';

const { redis, queueRedis } = vi.hoisted(() => ({
  redis: {
    hset: vi.fn(),
    incr: vi.fn(),
    get: vi.fn(),
    llen: vi.fn(),
  },
  queueRedis: {
    brpop: vi.fn(),
  },
}));

vi.mock('../config/redis', () => ({
  redis,
  queueRedis,
}));

import {
  getQueueLength,
  getTotalJobsCompleted,
  popJob,
  setJobCompleted,
  setJobError,
  setJobProcessing,
} from './worker-service';

describe('worker-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates job state while processing and after completion', async () => {
    const job: Job = {
      id: 'job-9',
      task: 'sort',
      value: 5,
      createdAt: 10,
    };

    await setJobProcessing(job.id, 100);
    await setJobCompleted(job, 'sorted', 2.5);

    expect(redis.hset).toHaveBeenNthCalledWith(
      1,
      'job:job-9',
      'status',
      'processing',
      'startedAt',
      '100'
    );
    expect(redis.incr).toHaveBeenCalledWith('total_jobs_completed');
    expect(redis.hset).toHaveBeenNthCalledWith(
      2,
      'job:job-9',
      expect.objectContaining({
        status: 'completed',
        result: 'sorted',
        durationSeconds: '2.5',
      })
    );
  });

  it('reads worker counters from redis', async () => {
    redis.get.mockResolvedValueOnce('6');
    redis.llen.mockResolvedValueOnce(1);
    queueRedis.brpop.mockResolvedValueOnce(['job_queue', '{"id":"job-1"}']);

    await setJobError({ id: 'job-2', task: 'fibonacci', value: 3, createdAt: 11 }, 'boom');
    await expect(getTotalJobsCompleted()).resolves.toBe(6);
    await expect(getQueueLength()).resolves.toBe(1);
    await expect(popJob()).resolves.toEqual(['job_queue', '{"id":"job-1"}']);

    expect(redis.hset).toHaveBeenCalledWith('job:job-2', 'status', 'error', 'errorMessage', 'boom');
  });
});
