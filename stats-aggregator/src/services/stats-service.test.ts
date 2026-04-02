import { beforeEach, describe, expect, it, vi } from 'vitest';

const { redis } = vi.hoisted(() => ({
  redis: {
    get: vi.fn(),
    llen: vi.fn(),
    keys: vi.fn(),
    hgetall: vi.fn(),
  },
}));

vi.mock('../config/redis', () => ({ redis }));

import {
  getAverageJobTimeSeconds,
  getCompleted,
  getQueueLength,
  getSubmitted,
} from './stats-service';

describe('stats-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reads counters from redis', async () => {
    redis.get.mockResolvedValueOnce('8');
    redis.get.mockResolvedValueOnce('5');
    redis.llen.mockResolvedValueOnce(3);

    await expect(getSubmitted()).resolves.toBe(8);
    await expect(getCompleted()).resolves.toBe(5);
    await expect(getQueueLength()).resolves.toBe(3);
  });

  it('calculates average job time from finished jobs', async () => {
    redis.keys.mockResolvedValue(['job:1', 'job:2', 'job:3']);
    redis.hgetall
      .mockResolvedValueOnce({ durationSeconds: '1.5' })
      .mockResolvedValueOnce({ durationSeconds: '2.5' })
      .mockResolvedValueOnce({ durationSeconds: 'oops' });

    await expect(getAverageJobTimeSeconds()).resolves.toBe(2);
  });
});
