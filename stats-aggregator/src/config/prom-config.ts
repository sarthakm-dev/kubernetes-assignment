import client from 'prom-client';
export const totalJobsSubmittedGauge = new client.Gauge({
  name: 'total_jobs_submitted',
  help: 'Total jobs submitted',
});

export const totalJobsCompletedGauge = new client.Gauge({
  name: 'total_jobs_completed',
  help: 'Total jobs completed',
});

export const queueLengthGauge = new client.Gauge({
  name: 'queue_length',
  help: 'Current Redis queue length',
});
