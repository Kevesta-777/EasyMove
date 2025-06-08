
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../shared/schema';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Create PostgreSQL pool with enhanced configuration for stability
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Enable SSL for Neon
  max: 10, // Reduced pool size for stability
  min: 2, // Minimum connections
  idleTimeoutMillis: 20000, // Shorter idle timeout
  connectionTimeoutMillis: 10000, // Longer connection timeout
  allowExitOnIdle: false,
});

// Enhanced error handler with reconnection logic
pool.on('error', (err: any) => {
  console.error('Unexpected database pool error:', err);
  if (err.code === '57P01' || err.code === 'ECONNRESET') {
    console.log('Database connection terminated, pool will auto-reconnect');
  }
});

pool.on('connect', () => {
  console.log('Database pool connected');
});

pool.on('remove', () => {
  console.log('Database client removed from pool');
});

// Create drizzle database instance
export const db = drizzle(pool, { schema });

// Export pool for direct queries if needed
export { pool };

// Health check function
export const checkDbConnection = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};
