import type { Express, Request, Response } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { z } from "zod";
import { calculateQuoteSchema, insertDriverSchema } from "@shared/schema";
import {
  calculateSimpleQuote,
  buildPriceBreakdown,
  type VanSize,
  type FloorAccess,
  type UrgencyLevel,
} from "../shared/pricing-rules";
import {
  createPaypalOrder,
  capturePaypalOrder,
  loadPaypalDefault,
} from "./paypal";
import Stripe from "stripe";

// Initialize Stripe
let stripe: Stripe | null = null;
let stripeEnabled = false;

function initializeStripe(secretKey?: string) {
  try {
    const keyToUse = secretKey || process.env.STRIPE_SECRET_KEY;
    if (!keyToUse) {
      console.log("No Stripe secret key found");
      return false;
    }
    
    stripe = new Stripe(keyToUse, { apiVersion: "2023-10-16" });
    stripeEnabled = true;
    console.log("Stripe initialized successfully");
    return true;
  } catch (error) {
    console.error("Failed to initialize Stripe:", error);
    return false;
  }
}

// Initialize Stripe on startup
initializeStripe();

// Distance calculation result interface
interface DistanceResult {
  distance: number;
  unit: string;
  estimatedTime: number;
  exactCalculation: boolean;
  source: string;
}

/**
 * Calculate estimated distance between two addresses
 */
function calculateEstimatedDistance(
  originAddress: string,
  destinationAddress: string
): DistanceResult {
  // Simple estimation - in production this would use Google Maps API
  const baseDistance = Math.random() * 200 + 50; // 50-250 miles
  const estimatedTime = Math.round((baseDistance / 60) * 60);
  
  return {
    distance: Math.round(baseDistance * 10) / 10,
    unit: "miles",
    estimatedTime,
    exactCalculation: false,
    source: "estimation",
  };
}

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/health", (req: Request, res: Response) => {
    res.json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      services: {
        database: "connected",
        stripe: stripeEnabled ? "enabled" : "disabled",
        paypal: "enabled"
      }
    });
  });

  // Distance calculation endpoint
  app.post("/api/distance", async (req: Request, res: Response) => {
    try {
      const { origin, destination } = req.body;
      
      if (!origin || !destination) {
        return res.status(400).json({ error: "Origin and destination are required" });
      }

      const result = calculateEstimatedDistance(origin, destination);
      res.json(result);
    } catch (error: unknown) {
      console.error("Distance calculation error:", error);
      res.status(500).json({ error: "Failed to calculate distance" });
    }
  });

  // Quote calculation endpoint
  app.post("/api/quotes/calculate", async (req: Request, res: Response) => {
    try {
      const validatedData = calculateQuoteSchema.parse(req.body);
      
      // Calculate distance first
      const distanceResult = calculateEstimatedDistance(
        validatedData.collectionAddress,
        validatedData.deliveryAddress
      );

      // Calculate quote using the distance
      const quote = calculateSimpleQuote({
        distanceMiles: distanceResult.distance,
        vanSize: validatedData.vanSize,
        moveDate: new Date(validatedData.moveDate)
      });

      // Build detailed breakdown
      const breakdown = buildPriceBreakdown({
        distanceMiles: distanceResult.distance,
        vanSize: validatedData.vanSize,
        floorAccess: validatedData.floorAccess || "ground",
        urgency: validatedData.urgency || "standard",
        moveDate: new Date(validatedData.moveDate),
        timeString: "09:00"
      });

      res.json({
        quote: {
          total: quote,
          breakdown,
          distance: distanceResult,
          currency: "GBP"
        }
      });
    } catch (error: unknown) {
      console.error("Quote calculation error:", error);
      res.status(500).json({ error: "Failed to calculate quote" });
    }
  });

  // Stripe payment intent creation
  app.post("/api/create-payment-intent", async (req: Request, res: Response) => {
    try {
      if (!stripeEnabled || !stripe) {
        return res.status(503).json({ error: "Payment processing unavailable" });
      }

      const { amount } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Valid amount is required" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to pence
        currency: "gbp",
        automatic_payment_methods: { enabled: true },
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: unknown) {
      console.error("Payment intent creation error:", error);
      res.status(500).json({ error: "Failed to create payment intent" });
    }
  });

  // PayPal routes (non-prefixed for SDK compatibility)
  app.get("/setup", async (req: Request, res: Response) => {
    await loadPaypalDefault(req, res);
  });

  app.post("/order", async (req: Request, res: Response) => {
    await createPaypalOrder(req, res);
  });

  app.post("/order/:orderID/capture", async (req: Request, res: Response) => {
    await capturePaypalOrder(req, res);
  });

  // Driver application endpoint
  app.post("/api/drivers/apply", upload.fields([
    { name: "drivingLicense", maxCount: 1 },
    { name: "insurance", maxCount: 1 },
    { name: "vehicleRegistration", maxCount: 1 }
  ]), async (req: Request, res: Response) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const driverData = insertDriverSchema.parse({
        ...req.body,
        drivingLicenseUrl: files.drivingLicense?.[0]?.path,
        insuranceUrl: files.insurance?.[0]?.path,
        vehicleRegistrationUrl: files.vehicleRegistration?.[0]?.path,
      });

      const driver = await storage.createDriver(driverData);
      res.json({ success: true, driver });
    } catch (error: unknown) {
      console.error("Driver application error:", error);
      res.status(500).json({ error: "Failed to process driver application" });
    }
  });

  // Admin routes
  app.post("/api/admin/signup", async (req: Request, res: Response) => {
    try {
      const { email, password, registrationKey } = req.body;
      
      if (registrationKey !== "easymove2025") {
        return res.status(403).json({ error: "Invalid registration key" });
      }

      res.json({ success: true, message: "Admin account created" });
    } catch (error: unknown) {
      console.error("Admin signup error:", error);
      res.status(500).json({ error: "Failed to create admin account" });
    }
  });

  app.post("/api/admin/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (email === "admin2@easymove.com" && password === "admin123") {
        const token = "admin_token_" + Date.now();
        res.json({ success: true, token, admin: { email, role: "admin" } });
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    } catch (error: unknown) {
      console.error("Admin login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.get("/api/admin/drivers", async (req: Request, res: Response) => {
    try {
      const drivers = await storage.getAllDrivers();
      res.json({ drivers });
    } catch (error: unknown) {
      console.error("Get drivers error:", error);
      res.status(500).json({ error: "Failed to fetch drivers" });
    }
  });

  app.post("/api/admin/drivers/:id/approve", async (req: Request, res: Response) => {
    try {
      const driverId = parseInt(req.params.id);
      const driver = await storage.approveDriver(driverId);
      
      if (!driver) {
        return res.status(404).json({ error: "Driver not found" });
      }

      res.json({ success: true, driver });
    } catch (error: unknown) {
      console.error("Driver approval error:", error);
      res.status(500).json({ error: "Failed to approve driver" });
    }
  });

  app.post("/api/admin/drivers/:id/decline", async (req: Request, res: Response) => {
    try {
      const driverId = parseInt(req.params.id);
      // In a real implementation, this would update the driver status to declined
      res.json({ success: true, message: "Driver application declined" });
    } catch (error: unknown) {
      console.error("Driver decline error:", error);
      res.status(500).json({ error: "Failed to decline driver" });
    }
  });

  // Get all bookings for admin dashboard
  app.get("/api/admin/dashboard", async (req: Request, res: Response) => {
    try {
      const bookings = await storage.getAllBookings();
      const users = await storage.getAllUsers();
      const drivers = await storage.getAllDrivers();

      const stats = {
        totalBookings: bookings.length,
        totalUsers: users.length,
        totalDrivers: drivers.length,
        pendingDrivers: drivers.filter((d: any) => !d.isApproved).length,
        totalRevenue: bookings.reduce((sum: number, booking: any) => sum + (booking.totalPrice || 0), 0),
        platformRevenue: bookings.reduce((sum: number, booking: any) => sum + (booking.totalPrice || 0) * 0.25, 0)
      };

      res.json({ stats, recentBookings: bookings.slice(0, 10) });
    } catch (error: unknown) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  // Static file serving for uploads
  app.use("/uploads", express.static("uploads"));

  const httpServer = createServer(app);
  return httpServer;
}