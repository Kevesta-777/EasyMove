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
} from "../shared/pricing-rules";
import {
  createPaypalOrder,
  capturePaypalOrder,
  loadPaypalDefault,
} from "./paypal";
import Stripe from "stripe";
import dotenv from 'dotenv';
import { adminRoutes } from "./routes/admin-routes";
import paypalRoutes from "./paypal-routes";
import { paymentRoutes } from "./routes/payment-routes";
import type { FloorAccess } from "@shared/schema";

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

    stripe = new Stripe(keyToUse, { apiVersion: "2024-11-20.acacia" as any });
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
 * Calculate real distance using Google Distance Matrix API
 */
async function calculateRealDistance(
  originAddress: string,
  destinationAddress: string,
): Promise<DistanceResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error("Google Maps API key not configured");
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?` +
        `origins=${encodeURIComponent(originAddress)}&` +
        `destinations=${encodeURIComponent(destinationAddress)}&` +
        `units=imperial&` +
        `key=${apiKey}`,
    );

    const data = await response.json();

    if (data.status !== "OK" || !data.rows[0]?.elements[0]) {
      throw new Error("Google Maps API returned invalid response");
    }

    const element = data.rows[0].elements[0];

    if (element.status !== "OK") {
      throw new Error(`Distance calculation failed: ${element.status}`);
    }

    // Extract distance in miles and duration in minutes
    const distanceText = element.distance.text;
    const distanceMiles = parseFloat(distanceText.replace(/[^\d.]/g, ""));
    const durationMinutes = Math.round(element.duration.value / 60);

    return {
      distance: Math.round(distanceMiles * 10) / 10,
      unit: "miles",
      estimatedTime: durationMinutes,
      exactCalculation: true,
      source: "google_maps",
    };
  } catch (error) {
    console.error("Google Maps API error:", error);
    throw error;
  }
}

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Register admin routes
  app.use('/api/admin', adminRoutes);

  // Health check endpoint
  app.get("/health", (req: Request, res: Response) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: "connected",
        stripe: stripeEnabled ? "enabled" : "disabled",
        paypal: "enabled",
      },
    });
  });

  // Distance calculation endpoint
  app.post("/api/distance", async (req: Request, res: Response) => {
    try {
      const { origin, destination } = req.body;

      if (!origin || !destination) {
        return res
          .status(400)
          .json({ error: "Origin and destination are required" });
      }

      const result = await calculateRealDistance(origin, destination);
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

      const distanceResult = await calculateRealDistance(
        validatedData.collectionAddress,
        validatedData.deliveryAddress,
      );

      // Google Maps duration is already in minutes (converted in calculateRealDistance)
      const googleMapsDurationMinutes = distanceResult.estimatedTime;
      
      // Log the duration for debugging
      console.log('Google Maps duration (minutes):', googleMapsDurationMinutes);
      
      // Calculate the quote with all details including Google Maps duration
      const quote = buildPriceBreakdown({
        distanceMiles: distanceResult.distance,
        vanSize: validatedData.vanSize,
        estimatedHours: googleMapsDurationMinutes / 60, // Convert minutes to hours for the function
        numHelpers: validatedData.helpers || 0,
        floorAccess: validatedData.floorAccess as FloorAccess || "ground",
        liftAvailable: false,
        moveDate: new Date(validatedData.moveDate),
        urgency: validatedData.urgency || "standard",
        googleMapsDurationMinutes: googleMapsDurationMinutes,
      });
      
      // Debug log the final formatted time
      console.log('Formatted estimated time:', quote.estimatedTime);

      res.json({
        quote: {
          ...quote,
          distance: distanceResult,
          currency: "GBP",
        },
      });
    } catch (error: unknown) {
      console.error("Quote calculation error:", error);
      res.status(500).json({ error: "Failed to calculate quote" });
    }
  });

  // Stripe payment intent creation
  app.post(
    "/api/create-payment-intent",
    async (req: Request, res: Response) => {
      try {
        if (!stripeEnabled || !stripe) {
          return res
            .status(503)
            .json({ error: "Payment processing unavailable" });
        }

        const { amount, bookingDetails } = req.body;

        if (!amount || amount <= 0) {
          return res.status(400).json({ error: "Valid amount is required" });
        }

        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100),
          currency: "gbp",
          automatic_payment_methods: { enabled: true },
          metadata: {
            bookingDetails: JSON.stringify(bookingDetails),
          },
        });

        res.json({ clientSecret: paymentIntent.client_secret });
      } catch (error: unknown) {
        console.error("Payment intent creation error:", error);
        res.status(500).json({ error: "Failed to create payment intent" });
      }
    },
  );

  // Payment confirmation and booking creation endpoint
  app.post("/api/confirm-booking", async (req: Request, res: Response) => {
    try {
      const { paymentIntentId, bookingDetails } = req.body;

      if (!stripeEnabled || !stripe) {
        return res.status(503).json({ error: "Payment processing unavailable" });
      }

      // Verify payment intent was successful
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ error: "Payment not completed" });
      }

      // Check if booking already exists for this payment intent
      const existingBooking = await storage.getBookingByPaymentIntent(paymentIntentId);
      if (existingBooking) {
        console.log('Booking already exists for payment intent:', paymentIntentId);
        return res.json({ 
          success: true, 
          bookingId: existingBooking.id,
          message: 'Booking already confirmed',
          booking: existingBooking
        });
      }

      // Create booking in database
      const booking = await storage.createBooking({
        customerId: null, // Guest booking for now
        driverId: null, // To be assigned later
        collectionAddress: bookingDetails.pickupAddress,
        deliveryAddress: bookingDetails.deliveryAddress,
        moveDate: new Date(bookingDetails.moveDate).toISOString().split('T')[0], // Convert to YYYY-MM-DD format
        vanSize: bookingDetails.vanSize,
        price: Math.round(paymentIntent.amount_received / 100), // Convert from pence to pounds
        distance: bookingDetails.distance || 0,
        status: 'confirmed',
        paymentIntentId: paymentIntentId,
        customerEmail: bookingDetails.customerEmail,
        customerPhone: bookingDetails.customerPhone,
        customerName: bookingDetails.customerName,
        specialRequirements: bookingDetails.specialRequirements,
        helpers: bookingDetails.helpers || 0,
        floorAccess: bookingDetails.floorAccess || 'ground',
        urgency: bookingDetails.urgency || 'standard'
      });

      console.log('Booking created successfully:', booking.id);
      res.json({ success: true, bookingId: booking.id, booking });
    } catch (error: unknown) {
      console.error("Booking confirmation error:", error);
      res.status(500).json({ error: "Failed to confirm booking" });
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
  app.post(
    "/api/drivers/apply",
    upload.fields([
      { name: "licenseDocument", maxCount: 1 },
      { name: "insuranceDocument", maxCount: 1 },
      { name: "liabilityDocument", maxCount: 1 },
      { name: "vehiclePhoto", maxCount: 1 },
    ]),
    async (req: Request, res: Response) => {
      try {
        const files = req.files as {
          [fieldname: string]: Express.Multer.File[];
        };
        const driverData = insertDriverSchema.parse({
          ...req.body,
          licenseDocument: files.licenseDocument?.[0]?.path,
          insuranceDocument: files.insuranceDocument?.[0]?.path,
          liabilityDocument: files.liabilityDocument?.[0]?.path,
          vehiclePhoto: files.vehiclePhoto?.[0]?.path,
        });

        // Check if driver already exists
        const existingDriver = await storage.getDriverByEmail(driverData.email);
        if (existingDriver) {
          return res.status(400).json({ 
            error: "Driver account already exists",
            message: "A driver account with this email already exists. Please use a different email or contact support."
          });
        }

        const driver = await storage.createDriver(driverData);
        res.json({ success: true, driver });
      } catch (error: unknown) {
        console.error("Driver application error:", error);
        if (error instanceof Error) {
          res.status(400).json({ 
            error: "Failed to process driver application",
            message: error.message
          });
        } else {
          res.status(500).json({ 
            error: "Failed to process driver application",
            message: "An unexpected error occurred"
          });
        }
      }
    },
  );

  app.use('/api/admin', adminRoutes);
  app.use('/api/paypal', paypalRoutes);

  // Admin routes
  app.post("/api/admin/signup", async (req: Request, res: Response) => {
    try {
      const { email, password, adminKey } = req.body;

      if (adminKey !== "easymove2025") {
        return res.status(403).json({ error: "Invalid registration key" });
      }

      // Check if admin already exists
      const existingAdmin = await storage.getUserByEmail(email);
      if (existingAdmin) {
        return res.status(400).json({ error: "Admin account already exists" });
      }

      // Create admin user in database
      const adminUser = await storage.createUser({
        username: email.split('@')[0],
        email,
        password, // In production, this should be hashed
        role: "admin",
        isActive: true
      });

      if (!adminUser) {
        throw new Error("Failed to create admin user");
      }

      res.json({ 
        success: true, 
        message: "Admin account created", 
        user: { 
          id: adminUser.id, 
          email: adminUser.email, 
          role: adminUser.role,
          username: adminUser.username
        } 
      });
    } catch (error: unknown) {
      console.error("Admin signup error:", error);
      res.status(500).json({ 
        error: "Failed to create admin account",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/admin/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      console.log('Admin login attempt:', { email, passwordProvided: !!password });

      // Retry mechanism for database connection issues
      let admin;
      let retries = 3;
      
      while (retries > 0) {
        try {
          admin = await storage.getUserByEmail(email);
          break; // Success, exit retry loop
        } catch (dbError: any) {
          console.log(`Database retry attempt ${4 - retries}, retries left: ${retries - 1}`);
          retries--;
          if (retries === 0) {
            throw dbError; // Final attempt failed
          }
          // Wait 1 second before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log('Admin found:', admin ? { id: admin.id, email: admin.email, role: admin.role } : 'No admin found');
      
      if (admin && admin.password === password && admin.role === "admin") {
        const token = "admin_token_" + Date.now();
        console.log('Admin login successful');
        res.json({ 
          success: true, 
          token, 
          admin: { 
            id: admin.id,
            email: admin.email, 
            role: admin.role,
            username: admin.username
          } 
        });
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    } catch (error: unknown) {
      console.error("Admin login error:", error);
      res.status(500).json({ error: "Login failed due to database connection issues" });
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

  app.post(
    "/api/admin/drivers/:id/approve",
    async (req: Request, res: Response) => {
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
    },
  );

  // Driver decline endpoint (keeping this one as it's not duplicated)
  app.post("/api/admin/drivers/:id/decline", async (req: Request, res: Response) => {
    try {
      const driverId = parseInt(req.params.id);
      const driver = await storage.getDriver(driverId);

      if (!driver) {
        return res.status(404).json({ error: "Driver not found" });
      }

      // In a real implementation, you might want to add a declined status
      // For now, we'll just return success
      res.json({ success: true, message: "Driver application declined" });
    } catch (error: unknown) {
      console.error("Driver decline error:", error);
      res.status(500).json({ error: "Failed to decline driver" });
    }
  });

  app.use("/uploads", express.static("uploads"));

  const httpServer = createServer(app);
  return httpServer;
}
