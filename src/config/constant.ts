import dotenv from 'dotenv';

dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Environment variable "${key}" is not set`);
  return value;
}

export const PORT = process.env['PORT'] ?? 3000;
export const DB_URL = requireEnv('DATABASE_URL');
export const JWT_SECRET = requireEnv('JWT_SECRET');
export const JWT_REFRESH_SECRET = requireEnv('JWT_REFRESH_SECRET');
export const REDIS_URL = requireEnv('REDIS_CLIENS');
