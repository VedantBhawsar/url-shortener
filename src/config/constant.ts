import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DB_URL) {
  throw new Error('DB_URL is not set');
}

export const PORT = process.env.PORT || 3000;
export const DB_URL = process.env.DB_URL!;
