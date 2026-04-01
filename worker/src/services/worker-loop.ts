import { popJob, setJobProcessing, setJobCompleted, setJobError } from './worker-service';
import { markJobProcessed, markJobError } from '../controllers/worker-controller';
import { Job } from '../types/job.types';

function fibonacci(n: number): number {
  if (n <= 0) return 0;
  if (n <= 2) return 1;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

function primesUpTo(limit: number): number {
  const sieve = new Array(limit + 1).fill(true);
  sieve[0] = sieve[1] = false;
  for (let i = 2; i * i <= limit; i++) {
    if (sieve[i]) {
      for (let j = i * i; j <= limit; j += i) sieve[j] = false;
    }
  }
  return sieve.reduce((count, isPrime) => count + (isPrime ? 1 : 0), 0);
}

function generateAndSortArray(n: number): number[] {
  const arr = Array.from({ length: n }, () => Math.floor(Math.random() * n));
  return arr.sort((a, b) => a - b);
}

export async function pollJobs(): Promise<void> {
  try {
    const item = await popJob();
    if (!item) {
      setImmediate(pollJobs);
      return;
    }

    const [, payload] = item;
    const job = JSON.parse(payload) as Job;
    const startedAt = Date.now();

    await setJobProcessing(job.id, startedAt);

    try {
      let result: string | number;

      switch (job.task) {
        case 'fibonacci':
          result = fibonacci(job.value || 35);
          break;
        case 'primes':
          result = primesUpTo(job.value || 100000);
          break;
        case 'sort':
          generateAndSortArray(job.value || 100000);
          result = 'sorted';
          break;
        default:
          result = fibonacci(job.value || 35);
      }

      const durationSeconds = (Date.now() - startedAt) / 1000;
      await setJobCompleted(job, result, durationSeconds);
      markJobProcessed(durationSeconds);
    } catch (err) {
      console.error('job execution failed', err);
      markJobError();
      await setJobError(job, err instanceof Error ? err.message : 'unknown');
    }
  } catch (err) {
    console.error('queue poll error', err);
    markJobError();
  } finally {
    setImmediate(pollJobs);
  }
}
