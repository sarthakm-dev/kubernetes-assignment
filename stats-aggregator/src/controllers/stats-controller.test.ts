import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Request, Response } from 'express';

const {
  getSubmitted,
  getCompleted,
  getQueueLength,
  getAverageJobTimeSeconds,
  totalJobsSubmittedGauge,
  totalJobsCompletedGauge,
  queueLengthGauge,
  register,
} = vi.hoisted(() => ({
  getSubmitted: vi.fn(),
  getCompleted: vi.fn(),
  getQueueLength: vi.fn(),
  getAverageJobTimeSeconds: vi.fn(),
  totalJobsSubmittedGauge: { set: vi.fn() },
  totalJobsCompletedGauge: { set: vi.fn() },
  queueLengthGauge: { set: vi.fn() },
  register: {
    contentType: 'text/plain',
    metrics: vi.fn(),
  },
}));

vi.mock('../services/stats-service', () => ({
  getSubmitted,
  getCompleted,
  getQueueLength,
  getAverageJobTimeSeconds,
}));

vi.mock('../config/prom-config', () => ({
  totalJobsSubmittedGauge,
  totalJobsCompletedGauge,
  queueLengthGauge,
}));

vi.mock('prom-client', () => ({
  default: {
    register,
  },
}));

import { metrics, stats } from './stats-controller';

function createResponse(): Response {
  return {
    json: vi.fn().mockReturnThis(),
    status: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

describe('stats-controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the current stats snapshot', async () => {
    getSubmitted.mockResolvedValue(10);
    getCompleted.mockResolvedValue(7);
    getQueueLength.mockResolvedValue(2);
    getAverageJobTimeSeconds.mockResolvedValue(1.4);
    const res = createResponse();

    await stats({} as Request, res);

    expect(res.json).toHaveBeenCalledWith({
      total_jobs_submitted: 10,
      total_jobs_completed: 7,
      queue_length: 2,
      avg_job_time_seconds: 1.4,
    });
  });

  it('updates gauges before returning metrics', async () => {
    getSubmitted.mockResolvedValue(11);
    getCompleted.mockResolvedValue(9);
    getQueueLength.mockResolvedValue(4);
    register.metrics.mockResolvedValue('queue_length 4');
    const res = createResponse();

    await metrics({} as Request, res);

    expect(totalJobsSubmittedGauge.set).toHaveBeenCalledWith(11);
    expect(totalJobsCompletedGauge.set).toHaveBeenCalledWith(9);
    expect(queueLengthGauge.set).toHaveBeenCalledWith(4);
    expect(res.set).toHaveBeenCalledWith('Content-Type', 'text/plain');
    expect(res.send).toHaveBeenCalledWith('queue_length 4');
  });
});
