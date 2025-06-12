import { db, pool } from "../db";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";
import { initializeDefaultPricingModel } from "./pricing-init";
import { sql } from "drizzle-orm";

/**
 * Update drivers table to use approval_status instead of is_approved
 */
async function updateDriversApprovalColumn() {
  try {
    // Check if approval_status column exists
    const approvalStatusExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'drivers' 
        AND column_name = 'approval_status'
      )
    `);

    const isApprovedExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'drivers' 
        AND column_name = 'is_approved'
      )
    `);

    // If approval_status exists, we're good
    if (approvalStatusExists.rows[0].exists) {
      return;
    }

    // If is_approved exists but approval_status doesn't, we need to migrate
    if (isApprovedExists.rows[0].exists) {
      // Add new column
      await db.execute(sql`
        ALTER TABLE drivers ADD COLUMN approval_status TEXT DEFAULT 'pending';
      `);

      // Migrate existing data
      await db.execute(sql`
        UPDATE drivers 
        SET approval_status = CASE 
          WHEN is_approved = TRUE THEN 'approved'
          WHEN is_approved = FALSE THEN 'pending'
        END;
      `);

      // Drop old column
      await db.execute(sql`
        ALTER TABLE drivers DROP COLUMN is_approved;
      `);
    } else {
      // If neither column exists, create approval_status with default
      await db.execute(sql`
        ALTER TABLE drivers ADD COLUMN approval_status TEXT DEFAULT 'pending';
      `);
    }

    console.log("Drivers table updated with approval_status column");
  } catch (error) {
    console.error("Error updating drivers table:", error);
    throw error;
  }
}

/**
 * Initializes the database and runs necessary setup
 */
export async function setupDatabase() {
  try {
    console.log("Setting up database...");
    
    // Create schema if it doesn't exist
    console.log("Pushing schema to database...");
    await createTables();
    
    // Add payment and customer columns if they don't exist
    await addPaymentColumns();
    
    // Add email, role, and is_active columns to users table if they don't exist
    await addUserEmailColumn();
    
    // Update drivers table to use approval_status
    await updateDriversApprovalColumn();
    
    // Initialize the default pricing model if needed
    try {
      await initializeDefaultPricingModel();
    } catch (error) {
      console.error("Error initializing default pricing model:", error);
    }
    
    console.log("Database setup complete");
  } catch (error) {
    console.error("Database setup error:", error);
    throw error;
  }
}

/**
 * Add email, role, and is_active columns to users table if they don't exist
 */
async function addUserEmailColumn() {
  try {
    // Add email column
    await db.execute(sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'users' 
          AND column_name = 'email'
        ) THEN
          ALTER TABLE users ADD COLUMN email TEXT;
          -- Update existing users to use username as email
          UPDATE users SET email = username WHERE email IS NULL;
          -- Make email column NOT NULL and UNIQUE after setting values
          ALTER TABLE users ALTER COLUMN email SET NOT NULL;
          ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
        END IF;
      END $$;
    `);

    // Add role column
    await db.execute(sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'users' 
          AND column_name = 'role'
        ) THEN
          ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';
          -- Set admin role for admin@easymove.com if it exists
          UPDATE users SET role = 'admin' WHERE email = 'admin@easymove.com';
        END IF;
      END $$;
    `);

    // Add is_active column
    await db.execute(sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'users' 
          AND column_name = 'is_active'
        ) THEN
          ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
          -- Ensure admin@easymove.com is active if it exists
          UPDATE users SET is_active = TRUE WHERE email = 'admin@easymove.com';
        END IF;
      END $$;
    `);

    console.log("Email, role, and is_active columns added to users table");
  } catch (error) {
    console.error("Error adding columns to users table:", error);
    throw error;
  }
}

/**
 * Add payment and customer-related columns to the bookings table
 */
async function addPaymentColumns() {
  try {
    // Add payment_intent_id column if it doesn't exist
    await db.execute(sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'bookings' 
          AND column_name = 'payment_intent_id'
        ) THEN
          ALTER TABLE bookings ADD COLUMN payment_intent_id TEXT;
        END IF;
      END $$;
    `);

    // Add payment_status column if it doesn't exist
    await db.execute(sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'bookings' 
          AND column_name = 'payment_status'
        ) THEN
          ALTER TABLE bookings ADD COLUMN payment_status TEXT DEFAULT 'pending';
        END IF;
      END $$;
    `);

    // Add payment_method column if it doesn't exist
    await db.execute(sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'bookings' 
          AND column_name = 'payment_method'
        ) THEN
          ALTER TABLE bookings ADD COLUMN payment_method TEXT;
        END IF;
      END $$;
    `);

    // Add payment_id column if it doesn't exist
    await db.execute(sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'bookings' 
          AND column_name = 'payment_id'
        ) THEN
          ALTER TABLE bookings ADD COLUMN payment_id TEXT;
        END IF;
      END $$;
    `);

    // Add customer_email column if it doesn't exist
    await db.execute(sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'bookings' 
          AND column_name = 'customer_email'
        ) THEN
          ALTER TABLE bookings ADD COLUMN customer_email TEXT;
        END IF;
      END $$;
    `);

    // Add customer_name column if it doesn't exist
    await db.execute(sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'bookings' 
          AND column_name = 'customer_name'
        ) THEN
          ALTER TABLE bookings ADD COLUMN customer_name TEXT;
        END IF;
      END $$;
    `);

    // Add customer_phone column if it doesn't exist
    await db.execute(sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'bookings' 
          AND column_name = 'customer_phone'
        ) THEN
          ALTER TABLE bookings ADD COLUMN customer_phone TEXT;
        END IF;
      END $$;
    `);

    // Add special_requirements column if it doesn't exist
    await db.execute(sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'bookings' 
          AND column_name = 'special_requirements'
        ) THEN
          ALTER TABLE bookings ADD COLUMN special_requirements TEXT;
        END IF;
      END $$;
    `);

    // Add helpers column if it doesn't exist
    await db.execute(sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'bookings' 
          AND column_name = 'helpers'
        ) THEN
          ALTER TABLE bookings ADD COLUMN helpers INTEGER DEFAULT 0;
        END IF;
      END $$;
    `);

    // Add floor_access column if it doesn't exist
    await db.execute(sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'bookings' 
          AND column_name = 'floor_access'
        ) THEN
          ALTER TABLE bookings ADD COLUMN floor_access TEXT;
        END IF;
      END $$;
    `);

    console.log("Payment and customer columns added to bookings table");
  } catch (error) {
    console.error("Error adding payment and customer columns:", error);
    throw error;
  }
}

/**
 * Create all tables based on the schema 
 */
async function createTables() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS drivers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT NOT NULL,
        experience TEXT NOT NULL,
        van_type TEXT NOT NULL,
        location TEXT NOT NULL,
        license_document TEXT NOT NULL,
        insurance_document TEXT NOT NULL,
        liability_document TEXT NOT NULL,
        vehicle_photo TEXT NOT NULL,
        is_approved BOOLEAN DEFAULT FALSE,
        rating REAL,
        completed_jobs INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS bookings (
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
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS pricing_models (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        base_price INTEGER NOT NULL,
        price_per_mile REAL NOT NULL,
        van_size_multipliers JSONB NOT NULL,
        urgency_multipliers JSONB NOT NULL,
        demand_factors JSONB NOT NULL,
        seasonal_factors JSONB NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS area_demand (
        id SERIAL PRIMARY KEY,
        area_name TEXT NOT NULL UNIQUE,
        demand_level REAL DEFAULT 1.0,
        active_drivers INTEGER DEFAULT 0,
        pending_bookings INTEGER DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create pricing_history table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS pricing_history (
        id SERIAL PRIMARY KEY,
        route TEXT NOT NULL,
        distance INTEGER NOT NULL,
        van_size TEXT NOT NULL,
        base_price INTEGER NOT NULL,
        final_price INTEGER NOT NULL,
        factors JSONB NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log("All database tables created or already exist");
  } catch (error) {
    console.error("Error creating tables:", error);
    throw error;
  }
}