import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Request, Response } from 'express';

const { enqueueJob, getJobStatus, isJobExist, totalJobsSubmitted, register, randomUUID } =
  vi.hoisted(() => ({
    enqueueJob: vi.fn(),
    getJobStatus: vi.fn(),
    isJobExist: vi.fn(),
    totalJobsSubmitted: { inc: vi.fn() },
    register: {
      contentType: 'text/plain',
      metrics: vi.fn(),
    },
    randomUUID: vi.fn(),
  }));

vi.mock('../services/job-service', () => ({
  enqueueJob,
  getJobStatus,
  isJobExist,
}));

vi.mock('../config/prom-config', () => ({
  totalJobsSubmitted,
}));

vi.mock('prom-client', () => ({
  default: {
    register,
  },
}));

vi.mock('crypto', () => ({
  randomUUID,
}));

import { metrics, status, submit } from './job-controller';

function createResponse(): Response {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

describe('job-controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    randomUUID.mockReturnValue('job-123');
  });

  it('queues a job and returns accepted', async () => {
    const req = {
      body: { task: 'primes', value: 50 },
    } as Request;
    const res = createResponse();

    await submit(req, res);

    expect(enqueueJob).toHaveBeenCalledWith({
      id: 'job-123',
      task: 'primes',
      value: 50,
      createdAt: expect.any(Number),
    });
    expect(totalJobsSubmitted.inc).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith({ id: 'job-123', message: 'job queued' });
  });

  it('returns 404 when the job is missing', async () => {
    isJobExist.mockResolvedValue(false);
    const req = {
      params: { id: 'missing-job' },
    } as unknown as Request;
    const res = createResponse();

    await status(req, res);

    expect(getJobStatus).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'job not found' });
  });

  it('returns metrics output', async () => {
    register.metrics.mockResolvedValue('metric_line 1');
    const res = createResponse();

    await metrics({} as Request, res);

    expect(res.set).toHaveBeenCalledWith('Content-Type', 'text/plain');
    expect(res.send).toHaveBeenCalledWith('metric_line 1');
  });
});
