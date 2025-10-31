import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';
import { env } from '@/lib/env';

// Use Pool with WebSocket for transaction support
const pool = new Pool({ connectionString: env.DATABASE_URL });
// conifgure logging in development environments
export const db = drizzle(pool, { schema, logger: env.NODE_ENV === 'development' ? true : false });