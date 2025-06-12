import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the root directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Database configuration
export const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'neondb',
  user: 'postgres',
  password: 'Iamnotgivingup2day!',
  ssl: false
};

// Construct connection string
export const connectionString = `postgresql://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;

// Other configurations can be added here 