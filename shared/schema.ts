import { pgTable, text, serial, integer, timestamp, boolean, date, real, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Define user table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Define detailed item schema
export const itemSchema = z.object({
  name: z.string(),
  quantity: z.number().int().positive(),
  weight: z.number().optional(),
  dimensions: z.string().optional(),
  fragile: z.boolean().optional().default(false),
  specialHandling: z.boolean().optional().default(false),
  notes: z.string().optional(),
});

// Define item details schema
export const itemDetailsSchema = z.object({
  totalItems: z.number().int().nonnegative().optional(),
  hasFragileItems: z.boolean().optional(),
  hasSpecialHandling: z.boolean().optional(),
  vanSizeAdjustment: z.number().optional(),
  itemsList: z.array(itemSchema).optional(),
});

// Define quote calculation schema
export const calculateQuoteSchema = z.object({
  collectionAddress: z.string().min(1, { message: "Collection address is required" }),
  deliveryAddress: z.string().min(1, { message: "Delivery address is required" }),
  moveDate: z.string().or(z.date()),
  vanSize: z.enum(["small", "medium", "large", "luton"]),
  urgency: z.enum(["standard", "priority", "express"]).optional(),
  floorAccess: z.enum(["ground", "first", "second", "third", "fourth", "above_fourth"]).optional(),
  helpers: z.number().int().nonnegative().optional(),
  itemDetails: itemDetailsSchema.optional(),
  items: z.array(itemSchema).optional(), // Direct array of items
});

// Define drivers table
export const drivers = pgTable("drivers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  experience: text("experience").notNull(),
  vanType: text("van_type").notNull(),
  location: text("location").notNull(),
  licenseDocument: text("license_document").notNull(),
  insuranceDocument: text("insurance_document").notNull(),
  liabilityDocument: text("liability_document").notNull(),
  vehiclePhoto: text("vehicle_photo").notNull(),
  isApproved: boolean("is_approved").default(false),
  rating: real("rating"),
  completedJobs: integer("completed_jobs").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const driversRelations = relations(drivers, ({ many }) => ({
  bookings: many(bookings),
}));

export const insertDriverSchema = createInsertSchema(drivers).omit({
  id: true,
  isApproved: true,
  rating: true,
  completedJobs: true,
  createdAt: true,
});

// Define bookings table
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => users.id),
  driverId: integer("driver_id").references(() => drivers.id),
  collectionAddress: text("collection_address").notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  moveDate: date("move_date").notNull(),
  vanSize: text("van_size").notNull(),
  price: integer("price").notNull(),
  distance: integer("distance").notNull(),
  urgency: text("urgency").default("standard"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bookingsRelations = relations(bookings, ({ one }) => ({
  customer: one(users, {
    fields: [bookings.customerId],
    references: [users.id],
  }),
  driver: one(drivers, {
    fields: [bookings.driverId],
    references: [drivers.id],
  }),
}));

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
});

// Define dynamic pricing model table
export const pricingModels = pgTable("pricing_models", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  basePrice: integer("base_price").notNull(),
  pricePerMile: real("price_per_mile").notNull(),
  vanSizeMultipliers: jsonb("van_size_multipliers").notNull(),
  urgencyMultipliers: jsonb("urgency_multipliers").notNull(),
  demandFactors: jsonb("demand_factors").notNull(),
  seasonalFactors: jsonb("seasonal_factors").notNull(), 
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPricingModelSchema = createInsertSchema(pricingModels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Define area demand table to track busy areas
export const areaDemand = pgTable("area_demand", {
  id: serial("id").primaryKey(),
  areaName: text("area_name").notNull().unique(),
  demandLevel: real("demand_level").default(1.0), // 1.0 is baseline
  activeDrivers: integer("active_drivers").default(0),
  pendingBookings: integer("pending_bookings").default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertAreaDemandSchema = createInsertSchema(areaDemand).omit({
  id: true,
  lastUpdated: true,
});

// Pricing history to track dynamic prices over time
export const pricingHistory = pgTable("pricing_history", {
  id: serial("id").primaryKey(),
  route: text("route").notNull(),
  distance: integer("distance").notNull(),
  vanSize: text("van_size").notNull(),
  basePrice: integer("base_price").notNull(),
  finalPrice: integer("final_price").notNull(),
  factors: jsonb("factors").notNull(), // Store the factors that influenced the price
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertPricingHistorySchema = createInsertSchema(pricingHistory).omit({
  id: true,
  timestamp: true,
});

// Exported types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type Driver = typeof drivers.$inferSelect;

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

export type InsertPricingModel = z.infer<typeof insertPricingModelSchema>;
export type PricingModel = typeof pricingModels.$inferSelect;

export type InsertAreaDemand = z.infer<typeof insertAreaDemandSchema>;
export type AreaDemand = typeof areaDemand.$inferSelect;

export type InsertPricingHistory = z.infer<typeof insertPricingHistorySchema>;
export type PricingHistory = typeof pricingHistory.$inferSelect;
