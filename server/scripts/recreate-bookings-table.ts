import { db } from '../../db';
import { sql } from 'drizzle-orm';

async function recreateBookingsTable() {
  try {
    console.log('Dropping bookings table...');
    await db.execute(sql`DROP TABLE IF EXISTS bookings`);

    console.log('Creating bookings table...');
    await db.execute(sql`
      CREATE TABLE bookings (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES users(id),
        driver_id INTEGER REFERENCES drivers(id),
        collection_address TEXT NOT NULL,
        delivery_address TEXT NOT NULL,
        move_date DATE NOT NULL,
        van_size TEXT NOT NULL,
        price INTEGER NOT NULL,
        distance REAL NOT NULL,
        urgency TEXT DEFAULT 'standard',
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Bookings table recreated successfully');
  } catch (error) {
    console.error('Error recreating bookings table:', error);
    throw error;
  }
}

recreateBookingsTable();
