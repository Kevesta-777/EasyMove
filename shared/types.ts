import {
  insertUserSchema,
  users,
  insertDriverSchema,
  drivers,
  insertBookingSchema,
  bookings,
  insertPricingModelSchema,
  pricingModels,
  insertAreaDemandSchema,
  areaDemand,
  insertPricingHistorySchema,
  pricingHistory,
  insertPaymentIntentSchema,
  paymentIntents,
} from "@shared/schema";

// User types
export type InsertUser = typeof insertUserSchema.shape;
export type User = typeof users.$inferSelect;

// Driver types
export type InsertDriver = typeof insertDriverSchema.shape;
export type Driver = typeof drivers.$inferSelect;

// Booking types
export type InsertBooking = typeof insertBookingSchema.shape;
export type Booking = typeof bookings.$inferSelect;

// Pricing model types
export type InsertPricingModel = typeof insertPricingModelSchema.shape;
export type PricingModel = typeof pricingModels.$inferSelect;

// Area demand types
export type InsertAreaDemand = typeof insertAreaDemandSchema.shape;
export type AreaDemand = typeof areaDemand.$inferSelect;

// Pricing history types
export type InsertPricingHistory = typeof insertPricingHistorySchema.shape;
export type PricingHistory = typeof pricingHistory.$inferSelect;

// Payment intent types
export type InsertPaymentIntent = typeof insertPaymentIntentSchema.shape;
export type PaymentIntent = typeof paymentIntents.$inferSelect;
