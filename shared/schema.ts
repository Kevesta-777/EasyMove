import { pgTable, text, serial, integer, timestamp, boolean, date, real, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Define FloorAccess type to match pricing-rules.ts
export type FloorAccess = 'ground' | 'firstFloor' | 'secondFloor' | 'thirdFloorPlus';

// Define user table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email"),
  password: text("password").notNull(),
  role: text("role").default("customer"), // customer, admin, support, viewer
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Create type for insert schema
export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
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
  floorAccess: z.enum(["ground", "firstFloor", "secondFloor", "thirdFloorPlus"]).optional(),
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
  approvalStatus: text("approval_status").notNull().default("pending"), // pending, approved, declined
  rating: real("rating"),
  completedJobs: integer("completed_jobs").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const driversRelations = relations(drivers, ({ many }) => ({
  bookings: many(bookings),
}));

export const insertDriverSchema = createInsertSchema(drivers).omit({
  id: true,
  approvalStatus: true,
  rating: true,
  completedJobs: true,
  createdAt: true,
});

// Define bookings table
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => users.id),
  driverId: integer("driver_id").references(() => drivers.id).notNull(),
  collectionAddress: text("collection_address").notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  moveDate: date("move_date").notNull(),
  vanSize: text("van_size").notNull(),
  price: real("price").notNull(),
  distance: real("distance").notNull(),
  urgency: text("urgency").default("standard"),
  status: text("status").default("pending"),
  helpers: integer("helpers").default(0),
  floorAccess: text("floor_access").notNull().default("ground"),
  createdAt: timestamp("created_at").defaultNow(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerName: text("customer_name").notNull(),
  specialRequirements: text("special_requirements"),
  paymentIntentId: text("payment_intent_id"),
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
  customerId: true,
  driverId: true,
  createdAt: true,
  customerEmail: true,
  customerPhone: true,
  customerName: true,
  specialRequirements: true,
  paymentIntentId: true,
  status: true,
  price: true,
  distance: true,
  moveDate: true,
  vanSize: true,
  helpers: true,
  collectionAddress: true,
  deliveryAddress: true,
  urgency: true,
  floorAccess: true,
} as { [K in keyof typeof bookings.$inferSelect]: true });

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

// Define payment intents table
export const paymentIntents = pgTable("payment_intents", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id),
  paymentProvider: text("payment_provider").notNull(), // paypal, stripe, etc.
  providerId: text("provider_id").notNull(), // Payment ID from provider
  amount: integer("amount").notNull(),
  currency: text("currency").notNull(),
  status: text("status").notNull(), // pending, succeeded, failed, refunded
  method: text("method").notNull(), // card, bank_transfer, etc.
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const paymentIntentsRelations = relations(paymentIntents, ({ one }) => ({
  booking: one(bookings, {
    fields: [paymentIntents.bookingId],
    references: [bookings.id],
  }),
}));

export const insertPaymentIntentSchema = createInsertSchema(paymentIntents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

export type InsertPaymentIntent = z.infer<typeof insertPaymentIntentSchema>;
export type PaymentIntent = typeof paymentIntents.$inferSelect;
