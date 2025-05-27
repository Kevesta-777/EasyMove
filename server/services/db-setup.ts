import { db, pool } from "../db";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "@shared/schema";
import { initializeDefaultPricingModel } from "./pricing-init";
import { sql } from "drizzle-orm";

/**
 * Initializes the database and runs necessary setup
 */
export async function setupDatabase() {
  try {
    console.log("Setting up database...");
    
    // Create schema if it doesn't exist
    console.log("Pushing schema to database...");
    await createTables();
    
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
 * Create all tables based on the schema 
 */
async function createTables() {
  try {
    // Create users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create drivers table
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
    
    // Create bookings table
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
        distance INTEGER NOT NULL,
        urgency TEXT DEFAULT 'standard',
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create pricing_models table
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
    
    // Create area_demand table
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