import { closeMailQueue } from './auth-client';

afterAll(async () => {
  await closeMailQueue();
});
