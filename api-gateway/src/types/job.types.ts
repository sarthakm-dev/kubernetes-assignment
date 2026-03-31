export type JobPayload = {
  task?: string;
  value?: number;
};

export type Job = {
  id: string;
  task: string;
  value: number;
  createdAt: number;
};
