import express from 'express';
import dotenv from 'dotenv';
import router from './routes';
import { pollJobs } from './services/worker-loop';

dotenv.config();

const app = express();
app.use(router);

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(PORT, () => {
  console.log(`Job worker/metrics up on port ${PORT}`);

  void pollJobs().catch((err) => {
    console.error('worker poll loop exited unexpectedly', err);
    process.exit(1);
  });
});
