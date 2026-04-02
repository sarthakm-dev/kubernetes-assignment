import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Request, Response } from 'express';

const {
  getQueueLength,
  getTotalJobsCompleted,
  jobsProcessed,
  jobProcessingTime,
  jobErrors,
  totalJobsCompleted,
  totalQueueLength,
  register,
  collectDefaultMetrics,
} = vi.hoisted(() => ({
  getQueueLength: vi.fn(),
  getTotalJobsCompleted: vi.fn(),
  jobsProcessed: { inc: vi.fn() },
  jobProcessingTime: { observe: vi.fn() },
  jobErrors: { inc: vi.fn() },
  totalJobsCompleted: { set: vi.fn() },
  totalQueueLength: { set: vi.fn() },
  register: {
    contentType: 'text/plain',
    metrics: vi.fn(),
  },
  collectDefaultMetrics: vi.fn(),
}));

vi.mock('../services/worker-service', () => ({
  getQueueLength,
  getTotalJobsCompleted,
}));

vi.mock('../config/prom-client', () => ({
  jobsProcessed,
  jobProcessingTime,
  jobErrors,
  totalJobsCompleted,
  totalQueueLength,
}));

vi.mock('prom-client', () => ({
  default: {
    register,
    collectDefaultMetrics,
  },
}));

import { getHealth, getMetrics, markJobError, markJobProcessed } from './worker-controller';

function createResponse(): Response {
  return {
    status: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

describe('worker-controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns worker metrics', async () => {
    getTotalJobsCompleted.mockResolvedValue(4);
    getQueueLength.mockResolvedValue(2);
    register.metrics.mockResolvedValue('jobs_processed_total 4');
    const res = createResponse();

    await getMetrics({} as Request, res);

    expect(totalJobsCompleted.set).toHaveBeenCalledWith(4);
    expect(totalQueueLength.set).toHaveBeenCalledWith(2);
    expect(res.set).toHaveBeenCalledWith('Content-Type', 'text/plain');
    expect(res.send).toHaveBeenCalledWith('jobs_processed_total 4');
  });

  it('updates prometheus counters for processed and failed jobs', () => {
    markJobProcessed(1.2);
    markJobError();

    expect(jobsProcessed.inc).toHaveBeenCalled();
    expect(jobProcessingTime.observe).toHaveBeenCalledWith(1.2);
    expect(jobErrors.inc).toHaveBeenCalled();
  });

  it('returns a simple health response', () => {
    const res = createResponse();

    getHealth({} as Request, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith('ok');
  });
});
