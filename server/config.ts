import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the root directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Get database URL from environment or use default for local development
const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/easymove';

// Parse the database URL
const url = new URL(databaseUrl);

// Database configuration
export const dbConfig = {
  host: url.hostname,
  port: parseInt(url.port, 10) || 5432,
  database: url.pathname.slice(1), // Remove leading /
  user: url.username,
  password: url.password,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// Use the provided connection string or construct one from config
export const connectionString = process.env.DATABASE_URL || `postgresql://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;

// Log database connection info (without password) for debugging
console.log('Connecting to database:', {
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  ssl: dbConfig.ssl ? 'enabled' : 'disabled'
});

// Other configurations can be added here