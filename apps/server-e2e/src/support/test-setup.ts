/* eslint-disable */
import { resolve } from 'node:path';
import axios from 'axios';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: resolve(process.cwd(), 'apps/server/.env') });

module.exports = async function () {
  // Configure axios for tests to use.
  const host = process.env.HOST ?? 'localhost';
  const port = process.env.PORT ?? '9000';
  axios.defaults.baseURL = `http://${host}:${port}`;
};
