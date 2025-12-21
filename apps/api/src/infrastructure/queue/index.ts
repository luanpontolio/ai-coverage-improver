import { Queue } from 'bullmq';

const connection = () => {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  return { url };
};

export const createQueue = (name: string, options: Record<string, unknown> = {}) => {
  return new Queue(name, { connection: connection(), ...options });
};

