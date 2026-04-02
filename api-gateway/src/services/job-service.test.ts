import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Job } from '../types/job.types';

const { redis } = vi.hoisted(() => ({
  redis: {
    hset: vi.fn(),
    lpush: vi.fn(),
    incr: vi.fn(),
    hgetall: vi.fn(),
  },
}));

vi.mock('../config/redis', () => ({ redis }));

import { enqueueJob, isJobExist } from './job-service';

describe('job-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('stores a new job in redis', async () => {
    const job: Job = {
      id: 'job-1',
      task: 'fibonacci',
      value: 12,
      createdAt: 123456,
    };

    await enqueueJob(job);

    expect(redis.hset).toHaveBeenCalledWith('job:job-1', {
      status: 'queued',
      task: 'fibonacci',
      value: '12',
      createdAt: '123456',
    });
    expect(redis.lpush).toHaveBeenCalledWith('job_queue', JSON.stringify(job));
    expect(redis.incr).toHaveBeenCalledWith('total_jobs_submitted');
  });

  it('reports whether a job exists', async () => {
    redis.hgetall.mockResolvedValueOnce({ status: 'queued' });
    await expect(isJobExist('job-1')).resolves.toBe(true);

    redis.hgetall.mockResolvedValueOnce({});
    await expect(isJobExist('job-2')).resolves.toBe(false);
  });
});
