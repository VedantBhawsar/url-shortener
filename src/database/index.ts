import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import { DB_URL } from '../config/constant';

const adapter = new PrismaPg({ connectionString: DB_URL });
const prisma = new PrismaClient({
  adapter,
  log: ['query', 'info', 'warn', 'error'],
  errorFormat: 'minimal',
});

export { prisma };
