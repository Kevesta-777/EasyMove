/**
 * Quote Calculator - Client-side implementation using centralized pricing rules
 *
 * This calculator uses the centralized pricing module to ensure consistent
 * quote calculation across the entire application.
 */

import {
  buildPriceBreakdown,
  formatPrice,
  PRICING_CONSTANTS,
  type VanSize,
  type FloorAccess,
  type UrgencyLevel,
} from "@shared/pricing-rules";

export interface QuoteParams {
  pickupAddress: string;
  deliveryAddress: string;
  distance: number;
  vanSize: VanSize;
  moveDate: Date;
  estimatedHours: number;
  helpers: number;
  floorAccess: FloorAccess;
  liftAvailable: boolean;
  urgency: UrgencyLevel;
  googleMapsDurationMinutes?: number;
}

export interface QuoteResult {
  // Basic information
  totalPrice: number;
  originalPrice?: number; // Store the original quote for consistency
  finalPrice?: number; // Final price to be used for checkout (usually same as originalPrice)
  totalWithVAT?: number; // Total price including VAT
  subTotal: number;
  priceString: string;
  currency: string;
  estimatedTime: string;
  explanation: string;

  // Location details
  pickupAddress?: string;
  deliveryAddress?: string;
  distance?: number;
  vanSize?: VanSize;
  moveDate?: Date;

  // Customer details
  customerEmail?: string; // Optional customer email for receipts

  // Price breakdown
  distanceCharge: number;
  timeCharge: number;
  helpersFee: number;
  floorAccessFee: number;
  peakTimeSurcharge: number;
  urgencySurcharge: number;
  fuelCost: number;
  returnJourneyCost: number;
  congestionCharge: number;

  // Commission and VAT details
  platformFee: number;
  driverShare: number;
  includesVAT?: boolean;
  vatAmount?: number;
  netAmount?: number;

  // Additional details
  breakdown: string[];
  vanSizeMultiplier: number;
}

/**
 * Detect if an address is likely in a congestion charge zone
 */
function isInCongestionZone(address: string): boolean {
  const lowerAddress = address.toLowerCase();

  // London congestion zone - very rough check for central London
  return (
    lowerAddress.includes("london") &&
    (lowerAddress.includes("ec1") ||
      lowerAddress.includes("ec2") ||
      lowerAddress.includes("ec3") ||
      lowerAddress.includes("ec4") ||
      lowerAddress.includes("wc1") ||
      lowerAddress.includes("wc2") ||
      lowerAddress.includes("sw1") ||
      lowerAddress.includes("w1") ||
      lowerAddress.includes("se1"))
  );
}

/**
 * Calculate a detailed quote using the centralized pricing rules
 */
export function calculateDetailedQuote(params: QuoteParams): QuoteResult {
  // Validate inputs first
  const validation = validateQuoteInputs(
    params.pickupAddress,
    params.deliveryAddress,
    params.distance
  );
  if (!validation.valid) {
    throw new Error(validation.message || "Invalid quote parameters");
  }

  // Calculate the price breakdown using the centralized pricing rules
  const priceBreakdown = buildPriceBreakdown({
    distanceMiles: params.distance,
    vanSize: params.vanSize,
    estimatedHours: params.estimatedHours,
    numHelpers: params.helpers || 0,
    floorAccess: params.floorAccess || "ground",
    liftAvailable: params.liftAvailable || false,
    moveDate: params.moveDate,
    urgency: params.urgency || "standard",
    // Pass the Google Maps duration in minutes if available, otherwise use estimatedHours
    googleMapsDurationMinutes: params.googleMapsDurationMinutes || Math.ceil(params.estimatedHours * 60)
  });

  // Calculate platform fee (25% of subtotal)
  const platformFee = Math.round(priceBreakdown.totalPrice * 0.25 * 100) / 100;
  // Calculate VAT (20% of platform fee)
  const vatAmount = Math.round(platformFee * 0.2 * 100) / 100;
  // Calculate driver payment (subtotal - platform fee - vat)
  const driverShare = priceBreakdown.totalPrice - platformFee - vatAmount;
  
  // Format the estimated time from Google Maps duration (in minutes)
  const estimatedTimeMinutes = Number(priceBreakdown.estimatedTime) || 0;
  const hours = Math.floor(estimatedTimeMinutes / 60);
  const minutes = estimatedTimeMinutes % 60;
  const formattedTime = hours > 0 
    ? `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} min${minutes !== 1 ? 's' : ''}`
    : `${minutes} min${minutes !== 1 ? 's' : ''}`;
  
  // Create explanation
  const explanation = `${formatPrice(priceBreakdown.totalPrice)} for a ${params.vanSize} van, ${params.distance.toFixed(1)} miles.`;

  // Create the result object with all required fields
  return {
    // Basic information
    totalPrice: priceBreakdown.totalPrice,
    originalPrice: priceBreakdown.totalPrice,
    finalPrice: priceBreakdown.totalPrice,
    totalWithVAT: priceBreakdown.totalPrice,
    subTotal: priceBreakdown.totalPrice,
    priceString: formatPrice(priceBreakdown.totalPrice),
    currency: PRICING_CONSTANTS.CURRENCY,
    estimatedTime: formattedTime,
    explanation: explanation,

    // Location details
    pickupAddress: params.pickupAddress,
    deliveryAddress: params.deliveryAddress,
    distance: params.distance,
    vanSize: params.vanSize,
    moveDate: params.moveDate,

    // Price breakdown - safely access properties
    distanceCharge:
      typeof priceBreakdown === "object" && priceBreakdown?.distanceCharge
        ? priceBreakdown.distanceCharge
        : 0,
    timeCharge:
      typeof priceBreakdown === "object" && priceBreakdown?.timeCharge
        ? priceBreakdown.timeCharge
        : 0,
    helpersFee:
      typeof priceBreakdown === "object" && priceBreakdown?.helpersFee
        ? priceBreakdown.helpersFee
        : 0,
    floorAccessFee:
      typeof priceBreakdown === "object" && priceBreakdown?.floorAccessFee
        ? priceBreakdown.floorAccessFee
        : 0,
    peakTimeSurcharge:
      typeof priceBreakdown === "object" && priceBreakdown?.peakTimeSurcharge
        ? priceBreakdown.peakTimeSurcharge
        : 0,
    urgencySurcharge:
      typeof priceBreakdown === "object" && priceBreakdown?.urgencySurcharge
        ? priceBreakdown.urgencySurcharge
        : 0,
    fuelCost:
      typeof priceBreakdown === "object" && priceBreakdown?.fuelCost
        ? priceBreakdown.fuelCost
        : 0,
    returnJourneyCost:
      typeof priceBreakdown === "object" && priceBreakdown?.returnJourneyCost
        ? priceBreakdown.returnJourneyCost
        : 0,
    congestionCharge:
      typeof priceBreakdown === "object" && priceBreakdown?.congestionCharge
        ? priceBreakdown.congestionCharge
        : 0,

    // Commission and VAT details (calculated on pre-VAT amount)
    platformFee: Math.round(priceBreakdown.totalPrice * 0.25 * 100) / 100,
    driverShare: Math.round(priceBreakdown.totalPrice * 0.75 * 100) / 100,
    includesVAT: true,
    vatAmount: vatAmount,
    netAmount: priceBreakdown.totalPrice,

    // Additional details
    breakdown:
      typeof priceBreakdown === "object" && priceBreakdown?.breakdown
        ? priceBreakdown.breakdown
        : [],
    vanSizeMultiplier:
      typeof priceBreakdown === "object" && priceBreakdown?.vanSizeMultiplier
        ? priceBreakdown.vanSizeMultiplier
        : 1.0,
  };
}

/**
 * Calculate a simple quote for the home page
 */
export function calculateSimpleQuote(
  distance: number,
  vanSize: VanSize = "medium",
  moveDate: Date = new Date(),
): QuoteResult {
  // For simplicity, we'll use the same calculation but with default values
  return calculateDetailedQuote({
    pickupAddress: "",
    deliveryAddress: "",
    distance,
    vanSize,
    moveDate,
    estimatedHours: Math.max(2, distance / 30), // Simple time estimate based on distance
    helpers: 0,
    floorAccess: "ground",
    liftAvailable: false,
    urgency: "standard",
  });
}

/**
 * Validate necessary inputs for a quote
 */
export function validateQuoteInputs(
  pickupAddress: string,
  deliveryAddress: string,
  distance: number,
): { valid: boolean; message?: string } {
  console.log("Validating quote inputs...", pickupAddress, deliveryAddress);
  if (!pickupAddress || pickupAddress.length < 5) {
    return { valid: false, message: "Please enter a valid pickup address" };
  }

  if (!deliveryAddress || deliveryAddress.length < 5) {
    return { valid: false, message: "Please enter a valid delivery address" };
  }

  if (!distance || distance <= 0) {
    return {
      valid: false,
      message: "Invalid distance. Addresses may be too similar or incomplete.",
    };
  }

  return { valid: true };
}

/**
 * Test the calculator with sample inputs
 */
export function runCalculatorTests(): void {
  console.log("Running quote calculator tests...");

  // Test case 1: Short distance
  const shortTest = calculateDetailedQuote({
    pickupAddress: "London EC1",
    deliveryAddress: "London EC2",
    distance: 2,
    vanSize: "small",
    moveDate: new Date(),
    estimatedHours: 2,
    helpers: 0,
    floorAccess: "ground",
    liftAvailable: false,
    urgency: "standard",
  });
  console.log(
    "Short distance test:",
    shortTest.totalPrice,
    shortTest.estimatedTime,
  );

  // Test case 2: Medium distance with helpers
  const mediumTest = calculateDetailedQuote({
    pickupAddress: "London",
    deliveryAddress: "Birmingham",
    distance: 120,
    vanSize: "medium",
    moveDate: new Date(),
    estimatedHours: 5,
    helpers: 1,
    floorAccess: "firstFloor",
    liftAvailable: true,
    urgency: "standard",
  });
  console.log(
    "Medium distance test:",
    mediumTest.totalPrice,
    mediumTest.estimatedTime,
  );

  // Test case 3: Long distance with urgent service
  const longTest = calculateDetailedQuote({
    pickupAddress: "London",
    deliveryAddress: "Edinburgh",
    distance: 400,
    vanSize: "luton",
    moveDate: new Date(),
    estimatedHours: 8,
    helpers: 2,
    floorAccess: "thirdFloorPlus",
    liftAvailable: false,
    urgency: "express",
  });
  console.log(
    "Long distance test:",
    longTest.totalPrice,
    longTest.estimatedTime,
  );
}
