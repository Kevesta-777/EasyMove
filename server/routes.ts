import type { Express } from "express";
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
  PRICING_CONSTANTS,
} from "../shared/pricing-rules";
import { getDynamicPriceRecommendation } from "./services/ai-pricing";
// Import Google Maps distance calculator for accurate measurements
import { calculateDistance } from "./services/google-maps-calculator";
import {
  generateVanSVG,
  generateServiceSVG,
  generateHeroSVG,
} from "./services/svg-generator";
import {
  generateVanImage,
  generateServiceImage,
  generateHeroImage,
} from "./services/image-generator";
import {
  createPaypalOrder,
  capturePaypalOrder,
  loadPaypalDefault,
  getClientToken,
} from "./paypal";

// Global cache for PayPal token
let cachedPayPalToken: string | null = null;
let tokenExpiration: number | null = null;

// Helper function to get or refresh PayPal token
async function getOrRefreshPayPalToken(): Promise<string> {
  const currentTime = Date.now();
  const tokenValidityPeriod = 10 * 60 * 1000; // 10 minutes

  // Return cached token if it's still valid
  if (cachedPayPalToken && tokenExpiration && currentTime < tokenExpiration) {
    console.log("Using cached PayPal token from server memory");
    return cachedPayPalToken;
  }

  // Get a new token
  console.log("Getting fresh PayPal client token...");
  try {
    const token = await getClientToken();
    cachedPayPalToken = token;
    tokenExpiration = currentTime + tokenValidityPeriod;
    console.log("PayPal token refreshed successfully");
    return token;
  } catch (error) {
    console.error("Failed to refresh PayPal token:", error);
    throw error;
  }
}

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

interface DistanceResponse {
  distance: number;
  unit: string;
  estimatedTime: number;
}

interface QuoteRequest {
  from: string;
  to: string;
}

/**
 * Calculate an estimated distance between two addresses
 * This is a simplified implementation for demo purposes
 */
function calculateEstimatedDistance(
  from: string,
  to: string,
): DistanceResponse {
  console.log(`Calculating distance from ${from} to ${to}`);

  // Simplified implementation - generates a reasonable distance based on address strings
  // In a real implementation, this would use a Maps API

  // Check if both addresses appear to be in the same city or area
  const fromLower = from.toLowerCase();
  const toLower = to.toLowerCase();

  // Extract the first part of any UK postcode if present (e.g., "RM6" from "RM6 5HR")
  const fromPostcodeMatch = fromLower.match(/([a-z]{1,2}[0-9]{1,2})/i);
  const toPostcodeMatch = toLower.match(/([a-z]{1,2}[0-9]{1,2})/i);

  const fromPostcode = fromPostcodeMatch
    ? fromPostcodeMatch[0].toUpperCase()
    : "";
  const toPostcode = toPostcodeMatch ? toPostcodeMatch[0].toUpperCase() : "";

  let distance: number;

  // Same postcode area (e.g., both in "RM6")
  if (fromPostcode && toPostcode && fromPostcode === toPostcode) {
    // Very short distance - typically 1-2 miles
    distance = 1 + Math.random() * 1;
  }
  // Same postcode district (e.g., both in "RM")
  else if (
    fromPostcode &&
    toPostcode &&
    fromPostcode.substring(0, 2) === toPostcode.substring(0, 2)
  ) {
    // Short distance - typically 2-10 miles
    distance = 2 + Math.random() * 8;
  }
  // Check for same city/area mentions
  else if (
    (fromLower.includes("london") && toLower.includes("london")) ||
    (fromLower.includes("manchester") && toLower.includes("manchester")) ||
    (fromLower.includes("birmingham") && toLower.includes("birmingham"))
  ) {
    // Medium distance within a major city - typically 3-15 miles
    distance = 3 + Math.random() * 12;
  }
  // Different cities/areas - calculate a greater distance
  else {
    // Long distance - typically 15-100+ miles
    distance = 15 + Math.random() * 85;

    // Adjust for London to other major cities
    if (
      (fromLower.includes("london") && !toLower.includes("london")) ||
      (!fromLower.includes("london") && toLower.includes("london"))
    ) {
      // London to other cities tends to be farther
      distance = 30 + Math.random() * 170;
    }
  }

  // Round to 1 decimal place
  distance = Math.round(distance * 10) / 10;

  // Calculate estimated travel time (in minutes)
  // Assume average speed of 30mph for shorter distances, 50mph for longer distances
  const avgSpeed = distance < 10 ? 30 : 50;
  const travelTimeHours = distance / avgSpeed;
  const travelTimeMinutes = Math.round(travelTimeHours * 60);

  return {
    distance,
    unit: "miles",
    estimatedTime: travelTimeMinutes,
  };
}

import Stripe from "stripe";

// Initialize Stripe with configurable keys
let stripe: Stripe | null = null;
let stripeEnabled = false;
let stripeConfig = {
  publicKey: "", // Will be set in initializeStripe if valid
  secretKey: "", // Will be set in initializeStripe if valid
};

// First check environment variables for Stripe keys
const envPublicKey = process.env.VITE_STRIPE_PUBLIC_KEY || "";
const envSecretKey = process.env.STRIPE_SECRET_KEY || "";

// Validate keys from environment variables
if (envPublicKey && envPublicKey.startsWith("pk_")) {
  stripeConfig.publicKey = envPublicKey;
  console.log(
    `Found valid Stripe public key from environment starting with: ${envPublicKey.substring(0, 7)}...`,
  );
} else if (envPublicKey) {
  console.warn(
    `Invalid Stripe public key format from environment: ${envPublicKey.substring(0, 7)}... - Must start with pk_`,
  );
}

if (envSecretKey && envSecretKey.startsWith("sk_")) {
  stripeConfig.secretKey = envSecretKey;
  console.log(
    `Found valid Stripe secret key from environment starting with: ${envSecretKey.substring(0, 7)}...`,
  );
} else if (envSecretKey) {
  console.warn(
    `Invalid Stripe secret key format from environment: ${envSecretKey.substring(0, 7)}... - Must start with sk_`,
  );
}

// Create a mock Stripe implementation for demo purposes when real keys aren't available
// Track mock payment intents in memory
const mockPaymentIntents: Record<string, any> = {};

const mockStripe = {
  paymentIntents: {
    create: async (params: any) => {
      console.log("MOCK STRIPE: Creating payment intent with params:", params);
      // Create a valid-looking payment intent ID - MUST start with 'pi_'
      const id = "pi_" + Math.random().toString(36).substring(2, 10);
      // Format must be exactly 'pi_*_secret_*' for the Stripe SDK to accept it
      // The key pattern is very specific and required by the Stripe SDK
      const client_secret = `${id}_secret_${Math.random().toString(36).substring(2, 10)}`;

      // Store the payment intent in our mock database
      const paymentIntent = {
        id,
        client_secret,
        status: "requires_payment_method",
        amount: params.amount,
        currency: params.currency,
        metadata: params.metadata,
        payment_method_types: params.payment_method_types || ["card"],
        receipt_email: params.receipt_email,
      };

      mockPaymentIntents[id] = paymentIntent;
      return paymentIntent;
    },
    retrieve: async (id: string) => {
      console.log("MOCK STRIPE: Retrieving payment intent:", id);
      // Check if we have this payment intent in our mock database
      if (mockPaymentIntents[id]) {
        return mockPaymentIntents[id];
      }

      // If not found, create a fake one for demo purposes
      return {
        id,
        status: "succeeded",
        amount: 5000,
        currency: "gbp",
        metadata: {
          totalAmount: "200",
          depositAmount: "50",
          remainingAmount: "150",
          platformFee: "50",
          bookingDetails: JSON.stringify({
            pickup: "Mock Pickup Address",
            delivery: "Mock Delivery Address",
            vanSize: "medium",
            moveDate: new Date().toISOString(),
          }),
          includesVAT: "true",
          vatAmount: "33.33",
        },
      };
    },
  },
  webhooks: {
    constructEvent: (payload: any, signature: string, secret: string) => {
      console.log("MOCK STRIPE: Constructing webhook event");
      return payload;
    },
  },
};

// Initialize Stripe function that can be called to reinitialize with new keys
function initializeStripe(secretKey?: string) {
  // Explicitly get keys from environment variables
  const envSecretKey = process.env.STRIPE_SECRET_KEY;
  const envPublicKey = process.env.VITE_STRIPE_PUBLIC_KEY;

  // Initialize variables for the keys we'll actually use
  let keyToUse = secretKey || envSecretKey || stripeConfig.secretKey;
  let publicKeyToUse = envPublicKey || stripeConfig.publicKey;

  // Check if keys are valid
  const hasValidSecretKey = keyToUse && keyToUse.startsWith("sk_");
  const hasValidPublicKey = publicKeyToUse && publicKeyToUse.startsWith("pk_");

  console.log("Stripe key validation:");
  console.log(
    `- Secret key format: ${hasValidSecretKey ? "valid" : "invalid"}`,
  );
  console.log(
    `- Public key format: ${hasValidPublicKey ? "valid" : "invalid"}`,
  );

  // Check if the keys are swapped
  if (
    envSecretKey &&
    envSecretKey.startsWith("pk_") &&
    envPublicKey &&
    envPublicKey.startsWith("sk_")
  ) {
    console.warn("⚠️ DETECTED SWAPPED STRIPE KEYS IN ENVIRONMENT VARIABLES");
    // Swap the values for actual use
    keyToUse = envPublicKey; // Use the public env var (sk_) as secret key
    publicKeyToUse = envSecretKey; // Use the secret env var (pk_) as public key
    console.log("Keys have been corrected for proper use");
  }

  // Log key formats for verification (without showing actual keys)
  if (keyToUse) {
    console.log(`Secret key format check: ${keyToUse.substring(0, 3)}...`);
  }
  if (publicKeyToUse) {
    console.log(
      `Public key format check: ${publicKeyToUse.substring(0, 3)}...`,
    );

    // Validate public key format
    if (publicKeyToUse.startsWith("pk_")) {
      stripeConfig.publicKey = publicKeyToUse;
      console.log(
        `Found valid Stripe public key starting with: ${publicKeyToUse.substring(0, 7)}...`,
      );
    } else {
      console.warn(
        `Invalid Stripe public key format: ${publicKeyToUse.substring(0, 7)}... - Must start with pk_`,
      );
    }
  }

  if (!keyToUse) {
    console.warn(
      "Missing Stripe secret key - Using demo mode with mock Stripe",
    );
    // Enable Stripe in mock mode for demo purposes
    stripeEnabled = true;
    stripe = mockStripe as any;
    return true;
  }

  try {
    // Make sure we're using a secret key (starts with sk_) not a publishable key (pk_)
    if (!keyToUse.startsWith("sk_")) {
      console.warn(
        "Invalid Stripe secret key format. Must start with sk_ - Using demo mode with mock Stripe",
      );
      // Enable Stripe in mock mode for demo purposes
      stripeEnabled = true;
      stripe = mockStripe as any;
      return true;
    }

    // Initialize real Stripe with valid key
    stripe = new Stripe(keyToUse);
    stripeEnabled = true;
    stripeConfig.secretKey = keyToUse;
    console.log("Stripe initialized successfully with real API key");
    return true;
  } catch (error) {
    console.error("Failed to initialize Stripe:", error);
    console.log("Using mock Stripe implementation for demo");
    stripeEnabled = true;
    stripe = mockStripe as any;
    return true;
  }
}

// Call initialize function with initial keys
initializeStripe();

import express from "express";
import { calculateDistance } from "./services/distance-calculator";
import { updatedCalculateDistance } from "./services/updated-enhanced-distance-calculator";
import { QuoteCalculationService } from "./services/quote-calculation";
const router = express.Router();

router.post("/api/calculate-quote", async (req, res) => {
  try {
    const { pickup, delivery, vanSize, helpers } = req.body;

    // Calculate distance
    const distance = await calculateDistance(pickup, delivery);

    // Calculate price
    const quote = QuoteCalculationService.calculatePrice({
      distance,
      vanSize,
      helpers,
    });

    res.json({ quote, distance});
  } catch (error) {
    res.status(500).json({ error: "Failed to calculate quote" });
  }
});

router.post("/api/calculate-distance", async (req, res) => {
  try {
    const { from, to } = req.body;

    // Calculate distance
    const distance = await updatedCalculateDistance(from, to);

    res.json({ distance });
  } catch (error) {
    res.status(500).json({ error: "Failed to calculate quote" });
  }
});

router.post("/api/create-payment", async (req, res) => {
  try {
    const { amount } = req.body;

    const paymentIntent = await stripe!.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "gbp",
      automatic_payment_methods: { enabled: true },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: "Payment creation failed" });
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(router);
  // Health check route for deployment monitoring
  app.get("/api/health", (req, res) => {
    const healthCheck = {
      uptime: process.uptime(),
      status: "OK",
      timestamp: new Date().toISOString(),
      services: {
        stripe: process.env.STRIPE_SECRET_KEY ? "configured" : "not configured",
        paypal: process.env.PAYPAL_CLIENT_ID ? "configured" : "not configured",
        database: process.env.DATABASE_URL ? "configured" : "not configured",
      },
    };
    res.status(200).json(healthCheck);
  });

  // API route for distance calculation using our reliable fixed calculator
  app.post("/api/quotes/distance", async (req, res) => {
    try {
      const { from, to } = req.body;

      if (!from || !to) {
        return res.status(400).json({
          error:
            'Missing addresses: both "from" and "to" addresses are required',
        });
      }

      // Import fixed distance calculator
      const { calculateDistance: calculateFixedDistance } = await import(
        "./services/fixed-distance-calculator"
      );

      // Use our fixed distance calculator for more reliable results
      const distanceResponse = await calculateFixedDistance(from, to);

      // Return detailed distance information
      res.json({
        ...distanceResponse,
        origin: from,
        destination: to,
        calculationMethod: distanceResponse.exactCalculation
          ? "exact_calculation"
          : "approximation",
      });
    } catch (error: any) {
      console.error("Error calculating distance:", error);
      // Include a default response with safe fallback values
      const fromAddress = req.body ? req.body.from || "" : "";
      const toAddress = req.body ? req.body.to || "" : "";

      res.status(500).json({
        error: error.message || "Failed to calculate distance",
        distance: 0,
        unit: "miles",
        estimatedTime: 0,
        origin: fromAddress,
        destination: toAddress,
        exactCalculation: false,
        calculationMethod: "error",
      });
    }
  });

  // API routes for quote calculation
  app.post("/api/quotes/calculate", async (req, res) => {
    try {
      const validatedData = calculateQuoteSchema.parse(req.body);

      // Import the fixed distance calculator for more reliable calculations
      // const { calculateDistance: calculateFixedDistance } = await import(
      //   "./services/fixed-distance-calculator"
      // );
      // console.log("aaaaaaaaaaaaaaaaaaaaaa", calculateFixedDistance);
      // // Calculate distance between addresses using our reliable fixed distance calculator
      // const distanceResponse = await calculateFixedDistance(
      //   validatedData.collectionAddress,
      //   validatedData.deliveryAddress,
      // );
      // console.log("bbbbbbbbbbbbbbbbbbbbbbbbb", distanceResponse);
      // import { updatedCalculateDistance } from "./services/updated-enhanced-distance-calculator";
      const { updatedCalculateDistance } = await import(
        "./services/updated-enhanced-distance-calculator"
      );
      const distanceResponse = await updatedCalculateDistance(
        validatedData.collectionAddress,
        validatedData.deliveryAddress,
      );

      // Use the calculated distance from the response
      const distance = distanceResponse.distance;

      // Calculate estimated time for delivery based on the response
      const estimatedTimeMinutes = distanceResponse.estimatedTime;

      const moveDate = new Date(validatedData.moveDate);
      const urgency = (validatedData.urgency as UrgencyLevel) || "standard";

      // Process detailed items if provided - improved handling for item details
      const itemDetails = validatedData.itemDetails || {};
      const moveItems = validatedData.items || [];

      // Calculate additional loading time based on item count
      const totalItems = itemDetails.totalItems || 0;
      const hasFragileItems = itemDetails.hasFragileItems || false;
      const hasSpecialHandling = itemDetails.hasSpecialHandling || false;

      // Adjust loading time based on item details
      let adjustedLoadingTime = estimatedTimeMinutes / 60; // Convert to hours

      // Add extra time for loading/unloading based on items count
      if (totalItems > 0) {
        // Use our loading time formula from pricing rules
        const floorAccess =
          (validatedData.floorAccess as FloorAccess) || "ground";
        const hasStairs = floorAccess !== "ground";

        // Import calculateLoadingTime from pricing-rules
        const { calculateLoadingTime } = await import(
          "../shared/pricing-rules"
        );

        // Calculate loading time based on van size, stairs presence, and item count
        const loadingTime = calculateLoadingTime(
          validatedData.vanSize as VanSize,
          hasStairs,
          totalItems,
        );

        // Add loading time to the overall time estimate
        adjustedLoadingTime += loadingTime;

        // Add additional time for fragile/special handling items
        if (hasFragileItems) adjustedLoadingTime += 0.5; // Extra 30 mins for fragile items
        if (hasSpecialHandling) adjustedLoadingTime += 0.5; // Extra 30 mins for special handling
      }

      // Use the centralized pricing constants instead of database lookup
      const basePrice = PRICING_CONSTANTS.MINIMUM_PRICE;
      const pricePerMile = PRICING_CONSTANTS.BASE_RATE_PER_MILE_MIN; // Use minimum rate for the API endpoint

      // Calculate price and round to nearest £10 for consistency with frontend calculator
      const calculatedBasePrice =
        Math.round((basePrice + distance * pricePerMile) / 10) * 10;

      // Calculate quote using our centralized pricing module
      const simpleParams = {
        distanceMiles: distance,
        vanSize: validatedData.vanSize as VanSize,
        moveDate,
        estimatedHours: adjustedLoadingTime,
        floorAccess: (validatedData.floorAccess as FloorAccess) || "ground",
        helpers: validatedData.helpers || 0,
        itemsCount: totalItems,
      };

      // Get a simple quote calculation using our standardized pricing module
      const simpleResult = calculateSimpleQuote(simpleParams);

      // Make sure totalWithVAT is properly set
      const totalWithVAT =
        simpleResult.totalWithVAT || simpleResult.totalPrice * 1.2;
      const estimatedHours = estimatedTimeMinutes / 60;
      const hours = Math.floor(estimatedTimeMinutes / 60);
      const minutes = estimatedTimeMinutes % 60;
      const formattedTime =
        hours > 0
          ? `${hours} hour${hours > 1 ? "s" : ""}${minutes > 0 ? ` ${minutes} min` : ""}`
          : `${minutes} minutes`;
      // Prepare a standardized quote response with VAT-inclusive prices
      const standardQuote = {
        totalPrice: totalWithVAT, // Use VAT-inclusive price
        totalWithVAT: totalWithVAT, // Add explicit totalWithVAT field
        price: totalWithVAT, // For backwards compatibility
        distance: distance,
        currency: simpleResult.currency,
        estimatedTime: estimatedHours,
        priceString: `£${totalWithVAT.toFixed(2)}`, // Format VAT-inclusive price
        explanation: simpleResult.explanation,
        breakdown: simpleResult.breakdown,
        driverShare: simpleResult.driverShare,
        platformFee: simpleResult.platformFee,
        includesVAT: true,
        vatAmount: simpleResult.vatAmount || totalWithVAT - totalWithVAT / 1.2,
      };

      // Check if we have OpenAI API key for AI-based pricing
      const hasOpenAIKey = process.env.OPENAI_API_KEY !== undefined;

      try {
        if (hasOpenAIKey) {
          // Try to use AI for dynamic pricing if the key is available
          const aiPricing = await getDynamicPriceRecommendation(
            calculatedBasePrice,
            distance,
            validatedData.vanSize,
            validatedData.collectionAddress,
            validatedData.deliveryAddress,
            moveDate,
            urgency,
          );

          // Format time estimate from minutes to hours
          const hours = Math.floor(estimatedTimeMinutes / 60);
          const minutes = estimatedTimeMinutes % 60;
          const formattedTime =
            hours > 0
              ? `${hours} hour${hours > 1 ? "s" : ""}${minutes > 0 ? ` ${minutes} min` : ""}`
              : `${minutes} minutes`;

          res.json({
            price: aiPricing.finalPrice,
            basePrice: aiPricing.basePrice,
            distance,
            currency: "GBP",
            estimatedTime: formattedTime,
            factors: {
              vanSizeMultiplier: aiPricing.vanSizeMultiplier,
              timeMultiplier: aiPricing.timeMultiplier,
              urgencyMultiplier: aiPricing.urgencyMultiplier,
              demandMultiplier: aiPricing.demandMultiplier,
              seasonalMultiplier: aiPricing.seasonalMultiplier,
            },
            explanation: aiPricing.explanation,
          });
        } else {
          // Fall back to standard pricing if no OpenAI key
          // But still use our accurate time estimate

          // Format time estimate from minutes to hours
          console.log("estimatedTime ::", estimatedTimeMinutes);

          console.log("standardQuote :: ", standardQuote);
          res.json({
            standardQuote,
          });
        }
      } catch (aiError) {
        console.error(
          "AI pricing error, falling back to standard formula:",
          aiError,
        );
        res.json(standardQuote);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        console.error("Quote calculation error:", error);
        res.status(500).json({ message: "Failed to calculate quote" });
      }
    }
  });

  // Add a dynamic pricing API route for admins to analyze data
  app.get("/api/pricing/history", async (req, res) => {
    try {
      // Return a simple mock history since we're not using the database for pricing history
      res.json([
        {
          id: 1,
          createdAt: new Date(),
          pickup: "London",
          delivery: "Manchester",
          distance: 200,
          vanSize: "medium",
          price: 350,
          factors: JSON.stringify({
            distance: 200,
            vanSize: "medium",
            helpers: 1,
            floor: "ground",
          }),
        },
      ]);
    } catch (error) {
      console.error("Error fetching pricing history:", error);
      res.status(500).json({ message: "Failed to fetch pricing history" });
    }
  });

  // Image generation routes for van sizes, services, and hero sections
  app.get("/api/images/van/:size", async (req, res) => {
    try {
      const vanSize = req.params.size as "small" | "medium" | "large" | "luton";
      if (!["small", "medium", "large", "luton"].includes(vanSize)) {
        return res.status(400).json({ message: "Invalid van size" });
      }

      const imagePath = await generateVanImage(vanSize);
      res.json({ path: imagePath });
    } catch (error) {
      console.error("Error generating van image:", error);
      res.status(500).json({ message: "Failed to generate van image" });
    }
  });

  app.get("/api/images/service/:type", async (req, res) => {
    try {
      const serviceType = req.params.type;
      const imagePath = await generateServiceImage(serviceType);
      res.json({ path: imagePath });
    } catch (error) {
      console.error("Error generating service image:", error);
      res.status(500).json({ message: "Failed to generate service image" });
    }
  });

  app.post("/api/images/hero", async (req, res) => {
    try {
      const { description } = req.body;
      if (!description) {
        return res.status(400).json({ message: "Description is required" });
      }

      const imagePath = await generateHeroImage(description);
      res.json({ path: imagePath });
    } catch (error) {
      console.error("Error generating hero image:", error);
      res.status(500).json({ message: "Failed to generate hero image" });
    }
  });

  // Stripe configuration endpoint
  app.post("/api/config/stripe", async (req, res) => {
    try {
      const { publicKey, secretKey } = req.body;

      // Validate the keys format
      if (publicKey && !publicKey.startsWith("pk_")) {
        return res
          .status(400)
          .json({ error: "Invalid public key format. Must start with pk_" });
      }

      if (secretKey && !secretKey.startsWith("sk_")) {
        return res
          .status(400)
          .json({ error: "Invalid secret key format. Must start with sk_" });
      }

      // Update the configuration
      if (publicKey) {
        stripeConfig.publicKey = publicKey;
        // We can't update environment variables at runtime,
        // but we can update our local configuration
      }

      if (secretKey) {
        // Initialize Stripe with the new secret key
        const initialized = initializeStripe(secretKey);
        if (!initialized) {
          return res.status(500).json({
            error: "Failed to initialize Stripe with the provided secret key",
          });
        }
      }

      res.json({
        success: true,
        message: "Stripe configuration updated successfully",
        publicKeyConfigured: !!stripeConfig.publicKey,
        secretKeyConfigured: !!stripeConfig.secretKey,
        stripeEnabled,
      });
    } catch (error: any) {
      console.error("Error updating Stripe configuration:", error);
      res.status(500).json({
        error: error.message || "Failed to update Stripe configuration",
      });
    }
  });

  // Driver registration endpoint
  // Stripe payment intent creation endpoint
  // IMPROVED APPROACH: Stripe Checkout Session (redirect flow)
  app.post("/api/create-stripe-checkout-session", async (req, res) => {
    try {
      // Always check if Stripe is available
      if (!stripe || !stripeEnabled) {
        console.log("Stripe not configured, enabling mock mode");
        stripeEnabled = true;
        stripe = mockStripe as any;
      }

      console.log(
        `Using ${stripe === mockStripe ? "MOCK" : "REAL"} Stripe for checkout session`,
      );

      const {
        finalPrice,
        totalWithVAT,
        pickupAddress,
        deliveryAddress,
        vanSize,
        moveDate,
        customerEmail,
      } = req.body;

      // Use either finalPrice or totalWithVAT, ensuring we have a valid amount
      const amount = finalPrice || totalWithVAT;

      // Validate price
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: "Invalid price provided" });
      }

      // Convert to pennies for Stripe (must be integer)
      const amountInPennies = Math.round(parseFloat(amount) * 100);

      // Create a formatted description
      const description = `EasyMove - ${vanSize || "Standard"} van from ${
        pickupAddress ? pickupAddress.substring(0, 20) + "..." : "pickup"
      } to ${
        deliveryAddress
          ? deliveryAddress.substring(0, 20) + "..."
          : "destination"
      }`;

      // Format move date if provided
      let formattedDate = "Scheduled date";
      if (moveDate) {
        try {
          formattedDate = new Date(moveDate).toLocaleDateString("en-GB", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
          });
        } catch (e) {
          console.warn("Could not format moveDate:", moveDate);
        }
      }

      console.log(
        `Creating checkout session for £${amount} (${amountInPennies} pennies)`,
      );

      // Create checkout session with better formatting and details
      // Make sure stripe is not null and fix type issues
      if (!stripe) {
        return res
          .status(500)
          .json({ error: "Stripe is not initialized properly" });
      }

      // Format the moveDate to ensure it's a string
      let moveDateString: string | undefined = undefined;
      if (moveDate) {
        try {
          moveDateString = new Date(moveDate).toISOString();
        } catch (e) {
          console.warn("Invalid moveDate format:", moveDate);
        }
      }

      // Dynamically determine the origin/host
      let origin = "http://localhost:5000";

      // Try different header approaches to get the host
      if (req.headers.origin) {
        origin = String(req.headers.origin);
      } else if (req.headers.host) {
        // Build origin from host header and protocol
        const host = String(req.headers.host);
        const protocol = req.headers["x-forwarded-proto"]
          ? String(req.headers["x-forwarded-proto"])
          : "https";
        origin = `${protocol}://${host}`;
      } else if (req.headers.referer) {
        // Try to extract from referer
        try {
          const refererUrl = new URL(String(req.headers.referer));
          origin = `${refererUrl.protocol}//${refererUrl.host}`;
        } catch (e) {
          console.warn("Could not parse referer URL", e);
        }
      }

      console.log(`Using origin URL for Stripe redirect: ${origin}`);

      // Create session with improved configuration
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "gbp",
              product_data: {
                name: "EasyMove Man and Van Service",
                description: `${description} - ${formattedDate}`,
                images: [`${origin}/logo.png`], // Add logo image
              },
              unit_amount: amountInPennies,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        customer_email: customerEmail || undefined, // Use undefined instead of null
        metadata: {
          pickupAddress: pickupAddress || "",
          deliveryAddress: deliveryAddress || "",
          vanSize: vanSize || "",
          moveDate: moveDateString || "",
          amount: amount.toString(),
        },
        success_url: `${origin}/booking-confirmation?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/stripe-checkout`,
        // Add billing details collection
        billing_address_collection: "auto",
        // Add more features for better user experience
        shipping_address_collection: {
          allowed_countries: ["GB"],
        },
        // Add checkout locale settings
        locale: "en",
      });

      // Return the session URL for redirect
      console.log("Created Stripe checkout session, URL:", session.url);

      // Return both the URL and ID for flexibility
      res.json({ url: session.url, id: session.id });
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({
        error: "Failed to create checkout session",
        details: error.message || "Unknown error",
      });
    }
  });

  app.post("/api/create-payment-intent", async (req, res) => {
    console.log("🔔 Creating payment intent with data:", req.body);
    // Always check if Stripe is available, and if not, use mock implementation
    if (!stripe || !stripeEnabled) {
      console.log("Stripe not configured, enabling mock mode");
      // Initialize mock Stripe for demo purposes
      stripeEnabled = true;
      stripe = mockStripe as any;
    }

    // Perform one more check for swapped keys
    if (
      process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_SECRET_KEY.startsWith("pk_") &&
      process.env.VITE_STRIPE_PUBLIC_KEY &&
      process.env.VITE_STRIPE_PUBLIC_KEY.startsWith("sk_")
    ) {
      console.warn("⚠️ DETECTED SWAPPED STRIPE KEYS IN ENVIRONMENT VARIABLES");
      console.warn("Re-initializing Stripe with the correct keys...");

      // Use the correct keys (they're swapped in env vars)
      const actualSecretKey = process.env.VITE_STRIPE_PUBLIC_KEY; // This has the secret key
      initializeStripe(actualSecretKey);

      console.log("🔄 Stripe re-initialized with corrected keys");
    }

    // Log the current status for debugging
    console.log(
      `Using ${stripe === mockStripe ? "MOCK" : "REAL"} Stripe implementation`,
    );

    // Log public key for debugging
    if (stripeConfig.publicKey) {
      console.log(
        `Stripe public key configured: ${stripeConfig.publicKey.substring(0, 8)}...`,
      );
    } else {
      console.log("No Stripe public key configured");
    }

    try {
      const { amount, bookingDetails } = req.body;

      if (!amount || typeof amount !== "number" || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount provided" });
      }

      // The amount passed from client is the TOTAL amount INCLUDING VAT
      // Make sure to round amount to avoid floating point issues
      const roundedAmount = Math.round(amount * 100) / 100;
      console.log(`Rounded amount: ${roundedAmount} pounds`);

      // Always use Math.round for Stripe amounts in pennies to avoid floating point issues
      // Use the FULL amount (not just deposit) for more reliable payment experience
      const amountInPennies = Math.round(roundedAmount * 100); // Convert to pennies for Stripe
      console.log(
        `Full amount for Stripe: ${amountInPennies} pennies (£${amountInPennies / 100})`,
      );

      try {
        // Create a payment intent for the FULL amount (more reliable)
        const paymentIntent = await stripe!.paymentIntents.create({
          amount: amountInPennies,
          currency: "gbp",
          // Use automatic payment methods for better reliability
          automatic_payment_methods: {
            enabled: true,
          },
          // Include minimal metadata (complex metadata can cause issues)
          metadata: {
            bookingDetails: JSON.stringify(bookingDetails || {}),
          },
        });

        console.log("Payment intent created:", paymentIntent.id);

        // Return the client secret for the frontend to complete the payment
        if (!paymentIntent.client_secret) {
          throw new Error("Payment intent did not return a client secret");
        }

        // Make sure client_secret is properly formatted
        if (typeof paymentIntent.client_secret !== "string") {
          throw new Error("Invalid client_secret format");
        }

        // Debug log the first few characters of client_secret to verify format
        console.log(
          `Client secret format check: ${paymentIntent.client_secret.substring(0, 15)}...`,
        );

        // Return the client secret and payment intent ID for the frontend
        res.json({
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
        });
      } catch (stripeError: any) {
        console.error("Stripe API error:", stripeError);
        return res.status(500).json({
          error: "Failed to create payment with Stripe",
          details: stripeError.message || "Unknown Stripe error",
        });
      }
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({
        error: error.message || "Failed to create payment intent",
      });
    }
  });

  // Get booking details endpoint for successful payments
  // Add a route to update booking email
  app.post("/api/update-booking-email", async (req, res) => {
    try {
      const { customerEmail, bookingId } = req.body;

      if (!customerEmail) {
        return res.status(400).json({ error: "Customer email is required" });
      }

      // Validate the email format
      if (!customerEmail.includes("@")) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      // In a real application, we would update the booking record in the database
      // For now, we'll just acknowledge the update

      // Success response
      res.json({ success: true, message: "Email updated successfully" });
    } catch (error: any) {
      console.error("Error updating booking email:", error);
      res.status(500).json({
        error: error.message || "Failed to update email",
      });
    }
  });

  app.get("/api/bookings/:paymentIntentId", async (req, res) => {
    if (!stripe || !stripeEnabled) {
      console.log("Stripe not configured, enabling mock mode for bookings");
      // Initialize mock Stripe for demo purposes
      stripeEnabled = true;
      stripe = mockStripe as any;
    }

    try {
      const { paymentIntentId } = req.params;
      if (!paymentIntentId) {
        return res.status(400).json({ error: "Payment ID is required" });
      }

      // Retrieve the payment intent from Stripe
      const paymentIntent =
        await stripe!.paymentIntents.retrieve(paymentIntentId);
      if (!paymentIntent) {
        return res.status(404).json({ error: "Payment not found" });
      }

      // Extract booking details from metadata
      const bookingDetails = paymentIntent.metadata.bookingDetails
        ? JSON.parse(paymentIntent.metadata.bookingDetails)
        : {};

      // Return the booking details
      res.json({
        id: `BK${Math.floor(Math.random() * 10000)}`, // Generate a booking ID
        status: paymentIntent.status === "succeeded" ? "confirmed" : "pending",
        createdAt: new Date().toISOString(),
        totalAmount: parseFloat(paymentIntent.metadata.totalAmount || "0"),
        depositAmount: parseFloat(paymentIntent.metadata.depositAmount || "0"),
        remainingAmount: parseFloat(
          paymentIntent.metadata.remainingAmount || "0",
        ),
        platformFee: parseFloat(paymentIntent.metadata.platformFee || "0"),
        includesVAT: paymentIntent.metadata.includesVAT === "true",
        vatAmount: parseFloat(paymentIntent.metadata.vatAmount || "0"),
        currency: paymentIntent.currency.toUpperCase(),
        paymentIntentId,
        bookingDetails,
      });
    } catch (error: any) {
      console.error("Error retrieving booking:", error);
      res.status(500).json({
        error: error.message || "Failed to retrieve booking details",
      });
    }
  });

  // Define multer storage
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./uploads/"); // Make sure this directory exists
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + "-" + file.originalname);
    },
  });

  const upload = multer({ storage });

  app.post(
    "/api/drivers/register",
    upload.fields([
      { name: "licenseDocument", maxCount: 1 },
      { name: "insuranceDocument", maxCount: 1 },
      { name: "liabilityDocument", maxCount: 1 },
      { name: "vehiclePhoto", maxCount: 1 },
    ]),
    async (req, res) => {
      try {
        const files = req.files as {
          [fieldname: string]: Express.Multer.File[];
        };

        // Validate driver data
        const driverData = {
          name: req.body.name,
          email: req.body.email,
          phone: req.body.phone,
          experience: req.body.experience,
          vanType: req.body.vanType,
          location: req.body.location,
          licenseDocument: files.licenseDocument?.[0]?.originalname || "",
          insuranceDocument: files.insuranceDocument?.[0]?.originalname || "",
          liabilityDocument: files.liabilityDocument?.[0]?.originalname || "",
          vehiclePhoto: files.vehiclePhoto?.[0]?.originalname || "",
        };

        const validatedData = insertDriverSchema.parse(driverData);

        // We're not actually storing the driver in the database for now
        // Just return a success response with a mock ID

        res.status(201).json({
          id: Math.floor(Math.random() * 1000) + 1,
          message: "Driver registration successful",
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          res.status(400).json({ message: error.errors });
        } else {
          console.error("Driver registration error:", error);
          res.status(500).json({ message: "Failed to register driver" });
        }
      }
    },
  );

  // Stripe webhook endpoint to handle events (payment successful, refunded, etc.)
  // PayPal API Routes

  // PayPal API Routes
  // Enhanced caching for PayPal tokens for ultra-fast payment processing
  let paypalTokenCache = {
    token: null as string | null,
    timestamp: 0,
    expiresIn: 3600 * 1000, // 1 hour in ms
    usageCount: 0,
    lastUsed: 0,
    isRefreshing: false,
    refreshPromise: null as Promise<string> | null,
  };

  // Get a fresh PayPal token with optimized performance
  const getOrRefreshPayPalToken = async (): Promise<string> => {
    const currentTime = Date.now();

    // Return existing token if it's still valid
    if (
      paypalTokenCache.token &&
      paypalTokenCache.timestamp > 0 &&
      currentTime - paypalTokenCache.timestamp < paypalTokenCache.expiresIn
    ) {
      paypalTokenCache.usageCount++;
      paypalTokenCache.lastUsed = currentTime;

      // Background refresh if token is getting old (80% of lifetime used)
      // or has been used many times
      const tokenAge = currentTime - paypalTokenCache.timestamp;
      const ageRatio = tokenAge / paypalTokenCache.expiresIn;

      if (
        (ageRatio > 0.8 || paypalTokenCache.usageCount > 50) &&
        !paypalTokenCache.isRefreshing
      ) {
        // Refresh in background for next use
        console.log("Starting background refresh of PayPal token");
        paypalTokenCache.isRefreshing = true;

        // Don't await, let this run in background
        setTimeout(async () => {
          try {
            // For test mode, simulate token refresh
            if (
              process.env.NODE_ENV === "development" &&
              process.env.PAYPAL_TEST_MODE === "true"
            ) {
              const fakeToken = `TEST-TOKEN-${Date.now()}`;
              paypalTokenCache.token = fakeToken;
              paypalTokenCache.timestamp = Date.now();
              paypalTokenCache.usageCount = 0;
              console.log("Background refresh completed with test token");
            } else {
              // Use the real PayPal API for a new token
              const { getClientToken } = await import("./paypal");
              const newToken = await getClientToken();
              paypalTokenCache.token = newToken;
              paypalTokenCache.timestamp = Date.now();
              paypalTokenCache.usageCount = 0;
              console.log("Background refresh completed with new PayPal token");
            }
          } catch (error) {
            console.error("Background token refresh failed:", error);
          } finally {
            paypalTokenCache.isRefreshing = false;
          }
        }, 0);
      }

      // Return the current token immediately while refresh happens in background
      return paypalTokenCache.token;
    }

    // If we're already refreshing, wait for that promise
    if (paypalTokenCache.isRefreshing && paypalTokenCache.refreshPromise) {
      return paypalTokenCache.refreshPromise;
    }

    // Need to get a new token
    console.log("Getting fresh PayPal client token...");

    paypalTokenCache.isRefreshing = true;

    // Create a promise for the token refresh
    paypalTokenCache.refreshPromise = (async () => {
      try {
        // For test mode, return a fake token immediately
        if (
          process.env.NODE_ENV === "development" &&
          process.env.PAYPAL_TEST_MODE === "true"
        ) {
          console.log("Using test mode for PayPal setup");
          const fakeToken = `TEST-TOKEN-${Date.now()}`;

          // Update cache
          paypalTokenCache.token = fakeToken;
          paypalTokenCache.timestamp = Date.now();
          paypalTokenCache.usageCount = 0;

          return fakeToken;
        }

        // Use the real PayPal API
        const { getClientToken } = await import("./paypal");
        const token = await getClientToken();

        // Update cache
        paypalTokenCache.token = token;
        paypalTokenCache.timestamp = Date.now();
        paypalTokenCache.usageCount = 0;

        console.log("PayPal token obtained and cached successfully");
        return token;
      } catch (error) {
        console.error("Failed to get PayPal token:", error);
        // If there was an error, clear the cache state
        paypalTokenCache.token = null;
        paypalTokenCache.timestamp = 0;
        throw error;
      } finally {
        paypalTokenCache.isRefreshing = false;
        paypalTokenCache.refreshPromise = null;
      }
    })();

    return paypalTokenCache.refreshPromise;
  };

  // Get PayPal client token for setup - with optimized caching for ultra-fast response
  app.get("/api/paypal/setup", async (req, res) => {
    try {
      console.log("Requested PayPal client token...");
      const startTime = Date.now();

      const token = await getOrRefreshPayPalToken();

      // Log timing for performance monitoring
      const processingTime = Date.now() - startTime;
      console.log(`PayPal token retrieval completed in ${processingTime}ms`);

      // Return the token
      res.status(200).json({
        clientToken: token,
        success: true,
        cached: paypalTokenCache.usageCount > 0,
        processingTime,
      });
    } catch (error) {
      console.error("PayPal setup error:", error);
      res.status(500).json({
        error: "Failed to load PayPal setup",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.post("/api/paypal/order", async (req, res) => {
    const startTime = Date.now();

    try {
      console.log("Received PayPal order request with body:", req.body);
      // Request body should contain: { intent, amount, currency }
      if (!req.body.amount || !req.body.currency || !req.body.intent) {
        console.error("Missing required PayPal parameters:", req.body);
        return res.status(400).json({
          error: "Missing required parameters",
          required: ["amount", "currency", "intent"],
          received: Object.keys(req.body),
        });
      }

      // Get a token first to ensure we're authenticated for faster order creation
      await getOrRefreshPayPalToken().catch((err) => {
        console.warn("Failed to prefetch token, continuing anyway:", err);
        // Continue without token, the createOrder function will get one if needed
      });

      // Simulate successful order creation for testing
      // This will be replaced with real PayPal integration
      if (
        process.env.NODE_ENV === "development" &&
        process.env.PAYPAL_TEST_MODE === "true"
      ) {
        console.log("Using test mode for PayPal order creation");

        // Add small delay to simulate network and keep timing consistent
        const responseTime = Date.now() - startTime;
        if (responseTime < 50) {
          await new Promise((resolve) =>
            setTimeout(resolve, 50 - responseTime),
          );
        }

        return res.status(200).json({
          id: `TEST-ORDER-${Date.now()}`,
          status: "CREATED",
          links: [
            {
              href: `https://www.sandbox.paypal.com/checkoutnow?token=TEST-TOKEN-${Date.now()}`,
              rel: "approve",
              method: "GET",
            },
          ],
          processingTime: Date.now() - startTime,
        });
      }

      // Use the real PayPal implementation but with performance tracking
      const originalJson = res.json;
      res.json = function (body) {
        // Add processing time to response
        const enhancedBody = {
          ...body,
          processingTime: Date.now() - startTime,
        };
        console.log(`PayPal order created in ${enhancedBody.processingTime}ms`);
        return originalJson.call(this, enhancedBody);
      };

      await createPaypalOrder(req, res);
    } catch (error) {
      console.error("PayPal order creation error:", error);
      res.status(500).json({
        error: "Failed to create PayPal order",
        details: error instanceof Error ? error.message : String(error),
        processingTime: Date.now() - startTime,
      });
    }
  });

  app.post("/api/paypal/order/:orderID/capture", async (req, res) => {
    const startTime = Date.now();

    try {
      const { orderID } = req.params;
      console.log("Capturing PayPal order:", orderID);

      // Pre-fetch a token to ensure faster capture processing
      await getOrRefreshPayPalToken().catch((err) => {
        console.warn(
          "Failed to prefetch token for capture, continuing anyway:",
          err,
        );
      });

      // Simulate successful order capture for testing
      if (
        process.env.NODE_ENV === "development" &&
        process.env.PAYPAL_TEST_MODE === "true" &&
        (orderID.startsWith("TEST-ORDER-") ||
          orderID.startsWith("QUICKMODE-") ||
          orderID.startsWith("SIMULATED-ORDER-"))
      ) {
        console.log("Using test mode for PayPal order capture");

        // Add small delay to simulate network for consistent UX
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime < 50) {
          await new Promise((resolve) => setTimeout(resolve, 50 - elapsedTime));
        }

        return res.status(200).json({
          id: orderID,
          status: "COMPLETED",
          payer: {
            email_address: "test-buyer@example.com",
            payer_id: "TEST-PAYER-ID",
          },
          purchase_units: [
            {
              reference_id: "default",
              amount: {
                currency_code: "GBP",
                value: "24.99",
              },
              shipping: {
                name: {
                  full_name: "John Doe",
                },
                address: {
                  address_line_1: "123 Test Street",
                  admin_area_2: "London",
                  postal_code: "SW1A 1AA",
                  country_code: "GB",
                },
              },
            },
          ],
          payment_source: {
            paypal: {
              name: {
                given_name: "John",
                surname: "Doe",
              },
              email_address: "test-buyer@example.com",
              account_id: "TEST-ACCOUNT-ID",
            },
          },
          processingTime: Date.now() - startTime,
        });
      }

      // Add performance tracking to the real implementation
      const originalJson = res.json;
      res.json = function (body) {
        // Add processing time to response
        const enhancedBody = {
          ...body,
          processingTime: Date.now() - startTime,
        };
        console.log(
          `PayPal order capture completed in ${enhancedBody.processingTime}ms`,
        );

        // Record this capture in the background for analysis
        setTimeout(() => {
          try {
            // We could log these metrics to a database for performance analysis
            const metric = {
              type: "paypal_capture",
              orderId: orderID,
              timestamp: new Date().toISOString(),
              processingTime: enhancedBody.processingTime,
              success: true,
            };
            console.log("Payment performance metric:", metric);
          } catch (err) {
            console.error("Failed to record metric:", err);
          }
        }, 0);

        return originalJson.call(this, enhancedBody);
      };

      await capturePaypalOrder(req, res);
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`PayPal capture error after ${processingTime}ms:`, error);

      res.status(500).json({
        error: "Failed to capture PayPal payment",
        details: error instanceof Error ? error.message : String(error),
        processingTime,
      });
    }
  });

  // Add routes without /api prefix for compatibility with the PayPal component
  // These routes simply forward to the /api/ routes
  app.get("/paypal/setup", async (req, res) => {
    try {
      const token = await getOrRefreshPayPalToken();
      res.json({
        clientToken: token,
      });
    } catch (error) {
      console.error("Error in /paypal/setup:", error);
      res.status(500).json({ error: "Failed to get PayPal client token" });
    }
  });

  app.post("/paypal/order", async (req, res) => {
    // Forward to the API route
    await createPaypalOrder(req, res);
  });

  app.post("/paypal/order/:orderID/capture", async (req, res) => {
    // Forward to the API route
    await capturePaypalOrder(req, res);
  });

  // Endpoint to warm up PayPal in the background for faster processing
  app.get("/api/paypal/warmup", async (req, res) => {
    try {
      console.log("Running PayPal warm-up...");
      const startTime = Date.now();

      // Preload token
      await getOrRefreshPayPalToken();

      const processingTime = Date.now() - startTime;
      console.log(`PayPal warm-up completed in ${processingTime}ms`);

      res.json({
        success: true,
        processingTime,
        message: "PayPal API warmed up successfully",
      });
    } catch (error) {
      console.error("PayPal warm-up error:", error);
      res.status(500).json({
        error: "Failed to warm up PayPal",
        message: error.message,
      });
    }
  });

  // Duplicate route without /api prefix for PayPal component compatibility
  app.get("/paypal/warmup", async (req, res) => {
    try {
      console.log("Running PayPal warm-up (non-prefixed route)...");
      const startTime = Date.now();

      // Preload token
      await getOrRefreshPayPalToken();

      const processingTime = Date.now() - startTime;
      console.log(`PayPal warm-up completed in ${processingTime}ms`);

      res.json({
        success: true,
        processingTime,
        message: "PayPal API warmed up successfully",
      });
    } catch (error) {
      console.error("PayPal warm-up error:", error);
      res.status(500).json({
        error: "Failed to warm up PayPal",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Start background token refresh for faster first payment request
  setTimeout(async () => {
    try {
      console.log("Pre-fetching PayPal token in background...");
      await getOrRefreshPayPalToken();
      console.log("PayPal ready for fast payment processing");
    } catch (err) {
      console.warn("Failed to pre-fetch PayPal token:", err);
    }
  }, 1000); // Start token fetch after 1 second (let server initialize first)

  const httpServer = createServer(app);
  return httpServer;
}
