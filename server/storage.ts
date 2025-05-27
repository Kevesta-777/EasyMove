import {
  users,
  type User,
  type InsertUser,
  drivers,
  type Driver,
  type InsertDriver,
  bookings,
  type Booking,
  type InsertBooking,
  pricingModels,
  type PricingModel,
  type InsertPricingModel,
  areaDemand,
  type AreaDemand,
  type InsertAreaDemand,
  pricingHistory,
  type PricingHistory,
  type InsertPricingHistory
} from "@shared/schema";
import { db } from "./db";
import { eq, like, and, desc } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Driver operations
  getDriver(id: number): Promise<Driver | undefined>;
  getDriverByEmail(email: string): Promise<Driver | undefined>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  approveDriver(id: number): Promise<Driver | undefined>;
  getDriversByLocation(location: string): Promise<Driver[]>;

  // Booking operations
  getBooking(id: number): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(id: number, status: string): Promise<Booking | undefined>;
  getBookingsByCustomer(customerId: number): Promise<Booking[]>;
  getBookingsByDriver(driverId: number): Promise<Booking[]>;
  
  // Pricing model operations
  getActivePricingModel(): Promise<PricingModel | undefined>;
  createPricingModel(model: InsertPricingModel): Promise<PricingModel>;
  
  // Area demand operations
  getAreaDemand(areaName: string): Promise<AreaDemand | undefined>;
  updateAreaDemand(areaName: string, data: Partial<AreaDemand>): Promise<AreaDemand | undefined>;
  getAllAreaDemand(): Promise<AreaDemand[]>;
  
  // Pricing history operations
  recordPriceCalculation(record: InsertPricingHistory): Promise<PricingHistory>;
  getPricingHistory(limit?: number): Promise<PricingHistory[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Driver operations
  async getDriver(id: number): Promise<Driver | undefined> {
    const [driver] = await db.select().from(drivers).where(eq(drivers.id, id));
    return driver;
  }

  async getDriverByEmail(email: string): Promise<Driver | undefined> {
    const [driver] = await db.select().from(drivers).where(eq(drivers.email, email));
    return driver;
  }

  async createDriver(insertDriver: InsertDriver): Promise<Driver> {
    const [driver] = await db.insert(drivers).values(insertDriver).returning();
    return driver;
  }

  async approveDriver(id: number): Promise<Driver | undefined> {
    const [driver] = await db
      .update(drivers)
      .set({ isApproved: true })
      .where(eq(drivers.id, id))
      .returning();
    return driver;
  }

  async getDriversByLocation(location: string): Promise<Driver[]> {
    return db
      .select()
      .from(drivers)
      .where(
        and(
          like(drivers.location, `%${location}%`),
          eq(drivers.isApproved, true)
        )
      );
  }

  // Booking operations
  async getBooking(id: number): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const [booking] = await db.insert(bookings).values(insertBooking).returning();
    return booking;
  }

  async updateBookingStatus(id: number, status: string): Promise<Booking | undefined> {
    const [booking] = await db
      .update(bookings)
      .set({ status })
      .where(eq(bookings.id, id))
      .returning();
    return booking;
  }

  async getBookingsByCustomer(customerId: number): Promise<Booking[]> {
    return db
      .select()
      .from(bookings)
      .where(eq(bookings.customerId, customerId));
  }

  async getBookingsByDriver(driverId: number): Promise<Booking[]> {
    return db
      .select()
      .from(bookings)
      .where(eq(bookings.driverId, driverId));
  }
  
  // Pricing model operations
  async getActivePricingModel(): Promise<PricingModel | undefined> {
    const [model] = await db
      .select()
      .from(pricingModels)
      .where(eq(pricingModels.isActive, true))
      .limit(1);
    return model;
  }
  
  async createPricingModel(model: InsertPricingModel): Promise<PricingModel> {
    // If this is set as active, deactivate all other models first
    if (model.isActive) {
      await db
        .update(pricingModels)
        .set({ isActive: false })
        .where(eq(pricingModels.isActive, true));
    }
    
    const [createdModel] = await db
      .insert(pricingModels)
      .values(model)
      .returning();
    return createdModel;
  }
  
  // Area demand operations
  async getAreaDemand(areaName: string): Promise<AreaDemand | undefined> {
    const [area] = await db
      .select()
      .from(areaDemand)
      .where(eq(areaDemand.areaName, areaName));
    return area;
  }
  
  async updateAreaDemand(areaName: string, data: Partial<AreaDemand>): Promise<AreaDemand | undefined> {
    // Check if area exists
    const existingArea = await this.getAreaDemand(areaName);
    
    if (existingArea) {
      // Update existing area
      const [updatedArea] = await db
        .update(areaDemand)
        .set({ ...data, lastUpdated: new Date() })
        .where(eq(areaDemand.areaName, areaName))
        .returning();
      return updatedArea;
    } else if (data.demandLevel !== undefined) {
      // Create new area
      const [newArea] = await db
        .insert(areaDemand)
        .values({
          areaName,
          demandLevel: data.demandLevel,
          activeDrivers: data.activeDrivers || 0,
          pendingBookings: data.pendingBookings || 0,
        })
        .returning();
      return newArea;
    }
    return undefined;
  }
  
  async getAllAreaDemand(): Promise<AreaDemand[]> {
    return db.select().from(areaDemand);
  }
  
  // Pricing history operations
  async recordPriceCalculation(record: InsertPricingHistory): Promise<PricingHistory> {
    const [priceRecord] = await db
      .insert(pricingHistory)
      .values(record)
      .returning();
    return priceRecord;
  }
  
  async getPricingHistory(limit = 100): Promise<PricingHistory[]> {
    return db
      .select()
      .from(pricingHistory)
      .orderBy(desc(pricingHistory.timestamp))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
