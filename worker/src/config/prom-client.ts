import client from 'prom-client';

export const jobsProcessed = new client.Counter({
  name: 'jobs_processed_total',
  help: 'Total number of jobs processed',
});

export const jobErrors = new client.Counter({
  name: 'job_errors_total',
  help: 'Total number of job errors',
});

export const jobProcessingTime = new client.Histogram({
  name: 'job_processing_time_seconds',
  help: 'Job processing time in seconds',
  buckets: [0.1, 0.5, 1, 2, 3, 5, 10],
});

export const totalJobsCompleted = new client.Gauge({
  name: 'total_jobs_completed',
  help: 'Total jobs completed across workers',
});

export const totalQueueLength = new client.Gauge({
  name: 'queue_length',
  help: 'Current queue length',
});
