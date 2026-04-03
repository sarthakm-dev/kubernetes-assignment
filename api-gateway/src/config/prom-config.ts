import client from 'prom-client';
export const totalJobsSubmitted = new client.Counter({
  name: 'job_submitter_total_jobs_submitted',
  help: 'Total jobs submitted through job submitter',
});
