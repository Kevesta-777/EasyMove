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
  const {
    pickupAddress,
    deliveryAddress,
    distance,
    vanSize,
    moveDate,
    estimatedHours,
    helpers,
    floorAccess,
    liftAvailable,
    urgency,
  } = params;

  // Check if either address is in a congestion zone
  const inLondon =
    isInCongestionZone(pickupAddress) || isInCongestionZone(deliveryAddress);
  // Get the detailed price breakdown using the central pricing module

  const priceBreakdown = buildPriceBreakdown({
    distanceMiles: distance,
    vanSize,
    estimatedHours,
    numHelpers: helpers,
    floorAccess,
    liftAvailable,
    moveDate,
    urgency,
    inLondon,
  });
  // Calculate subtotal (total before platform fee)
  const subTotal = priceBreakdown.totalPrice - priceBreakdown.platformFee;

  // Build an explanation that summarizes the quote
  // Always use VAT-inclusive price in the explanation - this ensures consistency with checkout

  const explanationPrice =
    priceBreakdown.totalWithVAT || Math.ceil(priceBreakdown.totalPrice * 1.2);
  let explanation = `${priceBreakdown.currency}${explanationPrice} for a ${vanSize} van, ${distance.toFixed(1)} miles.`;

  if (helpers > 0) {
    explanation += ` Includes ${helpers} helper${helpers > 1 ? "s" : ""}.`;
  }

  if (floorAccess !== "ground") {
    explanation += ` Includes ${floorAccess} floor access${liftAvailable ? " with lift" : ""}.`;
  }

  if (urgency !== "standard") {
    explanation += ` ${urgency.charAt(0).toUpperCase() + urgency.slice(1)} service.`;
  }

  explanation += ` Estimated time: ${priceBreakdown.estimatedTime}.`;

  // Use VAT calculations from the pricing rules
  const includesVAT = true; // Always include VAT in the pricing

  // Check if pricing module provides VAT (new version) or we need to calculate (backward compatibility)
  // Initialize VAT-related variables
  let vatAmount = 0;
  let netAmount = 0;
  let totalWithVAT = 0;

  // Extract the total price safely
  const totalPrice =
    typeof priceBreakdown === "object" && priceBreakdown !== null
      ? (priceBreakdown.totalPrice as number) || 0
      : 0;

  if (priceBreakdown && typeof priceBreakdown === "object") {
    if ("vatAmount" in priceBreakdown && "totalWithVAT" in priceBreakdown) {
      // Use the values from the updated pricing module
      vatAmount = priceBreakdown.vatAmount as number;
      totalWithVAT = priceBreakdown.totalWithVAT as number;
      netAmount = totalPrice; // The totalPrice is now the net price
    } else {
      // Backward compatibility: calculate VAT manually
      // For VAT-exclusive price, use exact 20% for VAT
      netAmount = totalPrice; // This is the net amount
      totalWithVAT = Math.ceil(totalPrice * 1.2); // Total with 20% VAT, rounded up
      vatAmount = Math.round(netAmount * 0.2); // VAT is 20% of the net price
    }
  }

  // Recalculate platform fee and driver share based on commission (25% platform, 75% driver)
  // This overrides the calculation in the pricing rules module to ensure exactly 25%
  const platformFee = Math.round(totalPrice * 0.25 * 100) / 100;
  const driverShare = Math.round(totalPrice * 0.75 * 100) / 100;

  // Default values for when priceBreakdown might be missing properties
  const defaultCurrency = "£";
  const defaultEstimatedTime = `${Math.ceil(distance / 30)} hours`;
  // Use VAT-inclusive price in the default explanation
  const defaultDisplayPrice = totalWithVAT || Math.ceil(totalPrice * 1.2);
  const defaultExplanation = `${defaultCurrency}${defaultDisplayPrice} for ${vanSize} van, ${distance.toFixed(1)} miles.`;

  // Ensure VAT-inclusive price is always used and prices are consistent
  const vatInclusivePrice = totalWithVAT || Math.ceil(totalPrice * 1.2);

  // Create the result object with all required fields - ENSURING PRICE CONSISTENCY
  return {
    // Basic information
    totalPrice: vatInclusivePrice, // Always use VAT-inclusive amount for consistency
    originalPrice: vatInclusivePrice, // Set original price to VAT-inclusive amount
    finalPrice: vatInclusivePrice, // Set final price to VAT-inclusive amount
    totalWithVAT: vatInclusivePrice, // Ensure totalWithVAT is properly set
    subTotal,
    currency:
      typeof priceBreakdown === "object" && priceBreakdown?.currency
        ? priceBreakdown.currency
        : defaultCurrency,
    // Always use VAT-inclusive price for priceString
    priceString: formatPrice(vatInclusivePrice),
    estimatedTime:
      typeof priceBreakdown === "object" && priceBreakdown?.estimatedTime
        ? priceBreakdown.estimatedTime
        : defaultEstimatedTime,
    explanation: explanation || defaultExplanation,

    // Location details
    pickupAddress,
    deliveryAddress,
    distance,
    vanSize,
    moveDate,

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

    // Commission and VAT details
    platformFee,
    driverShare,
    includesVAT,
    vatAmount,
    netAmount,

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
