import express from 'express';
import router from './routes';
import { pollJobs } from './services/worker-loop';

const app = express();
app.use(router);

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(PORT, () => {
  console.log(`Job worker/metrics up on port ${PORT}`);
  pollJobs();
});
