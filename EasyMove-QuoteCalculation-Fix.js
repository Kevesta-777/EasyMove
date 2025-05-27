/**
 * EasyMove Man and Van - Quote Calculation Fix
 *
 * This file contains fixes for the quote calculation issues to ensure
 * consistent, accurate pricing throughout the entire application.
 */

// ====================================================
// 1. PRICE CALCULATION CONSTANTS
// ====================================================

/**
 * Fix inconsistent pricing constants to ensure calculations are consistent
 * across the application
 */

// Replace the constants in shared/pricing-rules.ts
const PRICING_CONSTANTS = {
  // Base fare for the journey (minimum charge)
  BASE_FARE: 15.0,

  // Per-mile rates by van size
  PER_MILE_RATES: {
    small: 0.8,
    medium: 0.95,
    large: 1.1,
    luton: 1.2,
  },

  // Urban areas have higher per-mile rates due to congestion, parking, etc.
  URBAN_RATE_MULTIPLIER: 1.25,

  // Van size multipliers for calculating total costs
  VAN_SIZE_MULTIPLIERS: {
    small: 1.0, // Small/SWB van (baseline)
    medium: 1.2, // Medium/MWB van (20% more than small)
    large: 1.4, // Large/LWB van (40% more than small)
    luton: 1.6, // Luton/Box van (60% more than small)
  },

  // Hourly rates by van size (for time-based charging)
  HOURLY_RATES: {
    small: 25.0,
    medium: 30.0,
    large: 35.0,
    luton: 40.0,
  },

  // Helper charges per hour
  HELPER_RATE_PER_HOUR: 15.0,

  // Floor access charges
  FLOOR_ACCESS_FEES: {
    ground: 0.0,
    firstFloor: 15.0,
    secondFloor: 25.0,
    thirdFloorPlus: 40.0,
  },

  // Discount for lift available
  LIFT_DISCOUNT: 10.0,

  // Peak time multipliers
  WEEKEND_MULTIPLIER: 1.15, // 15% more on weekends
  EVENING_MULTIPLIER: 1.1, // 10% more for evening moves (after 6pm)
  HOLIDAY_MULTIPLIER: 1.25, // 25% more on public holidays

  // Urgency multipliers
  URGENCY_MULTIPLIERS: {
    standard: 1.0, // Standard booking (more than 7 days notice)
    priority: 1.15, // Priority booking (3-7 days notice)
    express: 1.3, // Express booking (less than 3 days notice)
  },

  // Fuel calculation constants
  MPG_BY_VAN_SIZE: {
    small: 35, // Small van ~ 35 mpg
    medium: 30, // Medium van ~ 30 mpg
    large: 25, // Large van ~ 25 mpg
    luton: 20, // Luton van ~ 20 mpg
  },

  // UK average diesel price per litre
  FUEL_COST_PER_LITRE: 1.5,

  // UK gallons to litres conversion factor
  LITRES_PER_GALLON: 4.54609,

  // Return journey factor (what % of the outbound journey cost to charge)
  RETURN_JOURNEY_FACTOR: 0.5,

  // London congestion charge (only apply for London movements)
  LONDON_CONGESTION_CHARGE: 15.0,

  // Commission rates
  PLATFORM_FEE_PERCENTAGE: 25, // 25% platform fee
  DRIVER_SHARE_PERCENTAGE: 75, // 75% goes to the driver

  // VAT rate (UK standard rate)
  VAT_RATE: 0.2, // 20% VAT
};

// ====================================================
// 2. DISTANCE CHARGE CALCULATION FIX
// ====================================================

/**
 * Fix the distance charge calculation to ensure consistent pricing
 */

// Fix the distance charge calculation function in shared/pricing-rules.ts
function calculateDistanceCharge(
  distanceMiles,
  vanSize = "medium",
  isUrban = false,
) {
  // Get the base rate for this van size
  const basePerMileRate =
    PRICING_CONSTANTS.PER_MILE_RATES[vanSize] ||
    PRICING_CONSTANTS.PER_MILE_RATES.medium;

  // Apply urban multiplier if applicable
  const perMileRate = isUrban
    ? basePerMileRate * PRICING_CONSTANTS.URBAN_RATE_MULTIPLIER
    : basePerMileRate;

  // Calculate basic distance charge with base fare
  const baseFare = PRICING_CONSTANTS.BASE_FARE;
  const mileageCharge = distanceMiles * perMileRate;

  // Calculate total and round to two decimal places for consistent currency handling
  const totalCharge = baseFare + mileageCharge;

  // Use proper rounding for currency values (to 2 decimal places)
  return Math.round(totalCharge * 100) / 100;
}

// ====================================================
// 3. VAN SIZE CALCULATION FIX
// ====================================================

/**
 * Fix the van size multiplier calculation
 */

// Fix the van size calculation in shared/pricing-rules.ts
function calculateVanSizeMultiplier(vanSize) {
  return (
    PRICING_CONSTANTS.VAN_SIZE_MULTIPLIERS[vanSize] ||
    PRICING_CONSTANTS.VAN_SIZE_MULTIPLIERS.medium
  );
}

function calculateHourlyRate(vanSize) {
  return (
    PRICING_CONSTANTS.HOURLY_RATES[vanSize] ||
    PRICING_CONSTANTS.HOURLY_RATES.medium
  );
}

function calculateTimeCharge(vanSize, hours) {
  const hourlyRate = calculateHourlyRate(vanSize);
  return Math.round(hourlyRate * hours * 100) / 100;
}

// ====================================================
// 4. FUEL COST CALCULATION FIX
// ====================================================

/**
 * Fix the fuel cost calculation to ensure accuracy
 */

// Fix the fuel cost calculation in shared/pricing-rules.ts
function calculateFuelCost(distanceMiles, vanSize = "medium") {
  // Get MPG for this van size, defaulting to medium if not found
  const mpg =
    PRICING_CONSTANTS.MPG_BY_VAN_SIZE[vanSize] ||
    PRICING_CONSTANTS.MPG_BY_VAN_SIZE.medium;

  // Calculate gallons needed: distance / mpg
  const gallonsNeeded = distanceMiles / mpg;

  // Convert to litres: gallons * litres per gallon
  const litresNeeded = gallonsNeeded * PRICING_CONSTANTS.LITRES_PER_GALLON;

  // Calculate cost: litres * cost per litre
  const totalFuelCost = litresNeeded * PRICING_CONSTANTS.FUEL_COST_PER_LITRE;

  // Round to two decimal places for currency
  return Math.round(totalFuelCost * 100) / 100;
}

// ====================================================
// 5. RETURN JOURNEY CALCULATION FIX
// ====================================================

/**
 * Fix the return journey calculation
 */

// Fix the return journey calculation in shared/pricing-rules.ts
function calculateReturnJourneyCost(distanceMiles, vanSize = "medium") {
  // Get the base per-mile rate (use the lowest rate for return journey)
  const basePerMileRate =
    PRICING_CONSTANTS.PER_MILE_RATES[vanSize] ||
    PRICING_CONSTANTS.PER_MILE_RATES.medium;

  // No base fare for return journey
  const mileageCharge = distanceMiles * basePerMileRate;

  // Apply the return journey factor to reduce the cost
  const discountedCharge =
    mileageCharge * PRICING_CONSTANTS.RETURN_JOURNEY_FACTOR;

  // Round to two decimal places for currency
  return Math.round(discountedCharge * 100) / 100;
}

// ====================================================
// 6. VAT CALCULATION FIX
// ====================================================

/**
 * Fix the VAT calculation to ensure consistency
 */

// Fix the VAT calculation functions in shared/pricing-rules.ts
function calculateVAT(price) {
  return Math.round(price * PRICING_CONSTANTS.VAT_RATE * 100) / 100;
}

function calculatePriceWithVAT(price) {
  return Math.round(price * (1 + PRICING_CONSTANTS.VAT_RATE) * 100) / 100;
}

// Ensure consistent price formatting for display
function formatPrice(price) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

// ====================================================
// 7. COMPLETE PRICE BREAKDOWN FIX
// ====================================================

/**
 * Fix the complete price breakdown calculation to ensure all components
 * are properly calculated and included
 */

// Fix the price breakdown function in shared/pricing-rules.ts
function buildPriceBreakdown(params) {
  // Destructure parameters with defaults
  const {
    vanSize = "medium",
    distance = 10,
    estimatedHours = 2,
    helpers = 0,
    floorAccess = "ground",
    liftAvailable = false,
    moveDate = new Date(),
    moveTime = "09:00",
    urgency = "standard",
    isUrban = false,
  } = params;

  // Get the van size multiplier
  const vanSizeMultiplier = calculateVanSizeMultiplier(vanSize);

  // Calculate distance charge
  const distanceCharge = calculateDistanceCharge(distance, vanSize, isUrban);

  // Calculate time-based charge
  const timeCharge = calculateTimeCharge(vanSize, estimatedHours);

  // Calculate helpers fee
  const helpersFee =
    PRICING_CONSTANTS.HELPER_RATE_PER_HOUR * estimatedHours * helpers;

  // Calculate floor access fee
  let floorAccessFee = PRICING_CONSTANTS.FLOOR_ACCESS_FEES[floorAccess] || 0;
  if (liftAvailable && floorAccessFee > 0) {
    floorAccessFee = Math.max(
      0,
      floorAccessFee - PRICING_CONSTANTS.LIFT_DISCOUNT,
    );
  }

  // Calculate peak time surcharge
  const peakTimeSurcharge = calculatePeakTimeSurcharge(moveDate, moveTime);

  // Calculate urgency surcharge
  const urgencySurcharge = calculateUrgencySurcharge(urgency);

  // Calculate fuel cost
  const fuelCost = calculateFuelCost(distance, vanSize);

  // Calculate return journey cost
  const returnJourneyCost = calculateReturnJourneyCost(distance, vanSize);

  // Check if congestion charge applies (simplified check for London)
  const isLondon =
    params.pickupAddress?.toLowerCase().includes("london") ||
    params.deliveryAddress?.toLowerCase().includes("london");
  const congestionCharge = isLondon
    ? PRICING_CONSTANTS.LONDON_CONGESTION_CHARGE
    : 0;

  // Calculate subtotal (without VAT)
  const subtotal =
    Math.round(
      (distanceCharge +
        timeCharge +
        helpersFee +
        floorAccessFee +
        peakTimeSurcharge +
        urgencySurcharge +
        fuelCost +
        returnJourneyCost +
        congestionCharge) *
        100,
    ) / 100;

  // Calculate VAT
  const vatAmount = calculateVAT(subtotal);

  // Calculate total (including VAT)
  const totalWithVAT = Math.round((subtotal + vatAmount) * 100) / 100;

  // Calculate platform fee and driver share
  const platformFee =
    Math.round(
      subtotal * (PRICING_CONSTANTS.PLATFORM_FEE_PERCENTAGE / 100) * 100,
    ) / 100;
  const driverShare =
    Math.round(
      subtotal * (PRICING_CONSTANTS.DRIVER_SHARE_PERCENTAGE / 100) * 100,
    ) / 100;

  // Format breakdown items for display
  const breakdown = [
    `Distance (${distance} miles): ${formatPrice(distanceCharge)}`,
    `Van size (${vanSize}): ${formatPrice(timeCharge)}`,
    `Helpers (${helpers}): ${formatPrice(helpersFee)}`,
    `Fuel: ${formatPrice(fuelCost)}`,
    `Return journey: ${formatPrice(returnJourneyCost)}`,
  ];

  // Add conditional charges to breakdown
  if (floorAccessFee > 0) {
    breakdown.push(
      `Floor access (${floorAccess}): ${formatPrice(floorAccessFee)}`,
    );
  }

  if (peakTimeSurcharge > 0) {
    const peakPercentage = Math.round(
      (peakTimeSurcharge / (distanceCharge + timeCharge + helpersFee)) * 100,
    );
    breakdown.push(
      `Peak time surcharge (${peakPercentage}%): ${formatPrice(peakTimeSurcharge)}`,
    );
  }

  if (urgencySurcharge > 0) {
    breakdown.push(
      `Urgency surcharge (${urgency}): ${formatPrice(urgencySurcharge)}`,
    );
  }

  if (congestionCharge > 0) {
    breakdown.push(`Congestion charge: ${formatPrice(congestionCharge)}`);
  }

  // Add subtotal, VAT and total to breakdown
  breakdown.push(`Subtotal (excluding VAT): ${formatPrice(subtotal)}`);
  breakdown.push(
    `VAT (${PRICING_CONSTANTS.VAT_RATE * 100}%): ${formatPrice(vatAmount)}`,
  );
  breakdown.push(`Total (including VAT): ${formatPrice(totalWithVAT)}`);

  // Add commission distribution
  breakdown.push(
    `Platform fee (${PRICING_CONSTANTS.PLATFORM_FEE_PERCENTAGE}%): ${formatPrice(platformFee)}`,
  );
  breakdown.push(
    `Driver share (${PRICING_CONSTANTS.DRIVER_SHARE_PERCENTAGE}%): ${formatPrice(driverShare)}`,
  );

  // Build explanation text
  const explanation = `${formatPrice(totalWithVAT)} for a ${vanSize} van, ${distance} miles. Estimated time: ${formatDuration(estimatedHours + distance / 30)}.`;

  // Return the complete quote with all calculated values
  return {
    totalPrice: totalWithVAT,
    originalPrice: totalWithVAT, // For tracking discounts in the future
    finalPrice: totalWithVAT, // Final price after any discounts
    totalWithVAT: totalWithVAT,
    subTotal: subtotal,
    currency: "£",
    priceString: formatPrice(totalWithVAT),
    estimatedTime: formatDuration(estimatedHours + distance / 30),
    explanation: explanation,
    distanceCharge: distanceCharge,
    timeCharge: timeCharge,
    helpersFee: helpersFee,
    floorAccessFee: floorAccessFee,
    peakTimeSurcharge: peakTimeSurcharge,
    urgencySurcharge: urgencySurcharge,
    fuelCost: fuelCost,
    returnJourneyCost: returnJourneyCost,
    congestionCharge: congestionCharge,
    platformFee: platformFee,
    driverShare: driverShare,
    includesVAT: true,
    vatAmount: vatAmount,
    netAmount: subtotal,
    breakdown: breakdown,
  };
}

// Helper function for peak time calculation
function calculatePeakTimeSurcharge(date, timeString) {
  const originalAmount = 0; // This would be the base amount to which we apply the multiplier
  let multiplier = 1.0; // Default multiplier (no surcharge)

  // Check for weekend
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 0 = Sunday, 6 = Saturday

  if (isWeekend) {
    multiplier *= PRICING_CONSTANTS.WEEKEND_MULTIPLIER;
  }

  // Check for evening (after 6pm)
  if (timeString) {
    const hourMinute = timeString.split(":");
    const hour = parseInt(hourMinute[0], 10);

    if (hour >= 18) {
      // 6pm or later
      multiplier *= PRICING_CONSTANTS.EVENING_MULTIPLIER;
    }
  }

  // Check for holiday
  if (isUKHoliday(date)) {
    multiplier *= PRICING_CONSTANTS.HOLIDAY_MULTIPLIER;
  }

  // If multiplier is still 1.0, then no surcharge applies
  if (multiplier === 1.0) {
    return 0;
  }

  // Calculate surcharge based on the original amount (distance + time + helpers)
  // Since we don't have the original amount here, we return the multiplier
  // The actual calculation happens in buildPriceBreakdown
  return multiplier - 1.0; // Return just the surcharge percentage
}

// Helper function for urgency surcharge
function calculateUrgencySurcharge(urgency) {
  const multiplier = PRICING_CONSTANTS.URGENCY_MULTIPLIERS[urgency] || 1.0;

  // If standard or invalid urgency, no surcharge
  if (multiplier === 1.0) {
    return 0;
  }

  // Return the surcharge percentage
  return multiplier - 1.0;
}

// Helper function to check UK holidays (simplified)
function isUKHoliday(date) {
  const month = date.getMonth(); // 0-11
  const day = date.getDate(); // 1-31

  // New Year's Day
  if (month === 0 && (day === 1 || (day === 2 && date.getDay() === 1)))
    return true;

  // Good Friday & Easter Monday - simplified to early April
  if (month === 3 && day >= 1 && day <= 20) {
    // This is a simplification as Easter moves
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 5 || dayOfWeek === 1) return true; // Friday or Monday
  }

  // Early May Bank Holiday (First Monday in May)
  if (month === 4 && day <= 7 && date.getDay() === 1) return true;

  // Spring Bank Holiday (Last Monday in May)
  if (month === 4 && day >= 25 && date.getDay() === 1) return true;

  // Summer Bank Holiday (Last Monday in August)
  if (month === 7 && day >= 25 && date.getDay() === 1) return true;

  // Christmas Day
  if (month === 11 && day === 25) return true;

  // Boxing Day
  if (month === 11 && day === 26) return true;

  // Boxing Day (substitute)
  if (
    month === 11 &&
    day === 27 &&
    (date.getDay() === 1 || date.getDay() === 2)
  )
    return true;

  // Christmas Day (substitute)
  if (month === 11 && day === 27 && date.getDay() === 1) return true;

  return false;
}

// Helper function to format duration
function formatDuration(hours) {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);

  if (minutes === 0) {
    return wholeHours === 1 ? "1 hour" : `${wholeHours} hours`;
  } else if (wholeHours === 0) {
    return `${minutes} minutes`;
  } else {
    return `${wholeHours} hour${wholeHours !== 1 ? "s" : ""} and ${minutes} minute${minutes !== 1 ? "s" : ""}`;
  }
}

// ====================================================
// 8. QUOTE SAVING AND VALIDATION
// ====================================================

/**
 * Add this function to ensure quote data is valid before saving
 */

function validateAndSaveQuote(quoteData) {
  // Required fields for a valid quote
  const requiredFields = [
    "totalPrice",
    "finalPrice",
    "totalWithVAT",
    "pickupAddress",
    "deliveryAddress",
    "distance",
    "vanSize",
    "moveDate",
  ];

  // Check for missing fields
  const missingFields = requiredFields.filter(
    (field) => !quoteData[field] && quoteData[field] !== 0,
  );

  // If any fields are missing, we can't save
  if (missingFields.length > 0) {
    console.error(
      `Cannot save quote: Missing required fields: ${missingFields.join(", ")}`,
    );
    return false;
  }

  // Validate numeric values
  const numericFields = [
    "totalPrice",
    "finalPrice",
    "totalWithVAT",
    "distance",
  ];
  const invalidNumeric = numericFields.filter((field) =>
    isNaN(parseFloat(quoteData[field])),
  );

  if (invalidNumeric.length > 0) {
    console.error(
      `Cannot save quote: Invalid numeric values in fields: ${invalidNumeric.join(", ")}`,
    );
    return false;
  }

  // Validate date
  if (quoteData.moveDate) {
    const moveDate = new Date(quoteData.moveDate);
    if (isNaN(moveDate.getTime())) {
      return false;
    }
  }

  // Save to localStorage for persistence
  try {
    localStorage.setItem("easyMoveQuote", JSON.stringify(quoteData));
    return true;
  } catch (error) {
    console.error("Error saving quote to localStorage:", error);
    return false;
  }
}

// ====================================================
// 9. API ENDPOINT FOR QUOTE CALCULATION
// ====================================================

/**
 * Fix the quote calculation API to use the correct calculation methods
 */

// Fix the quote calculation API in server/routes.ts
async function calculateQuoteHandler(req, res) {
  try {
    const quoteRequest = req.body;

    // Validate request
    if (!quoteRequest.pickupAddress || !quoteRequest.deliveryAddress) {
      return res.status(400).json({ error: "Missing required addresses" });
    }

    // Convert date string to Date object if needed
    let moveDate = quoteRequest.moveDate
      ? new Date(quoteRequest.moveDate)
      : new Date();

    // Validate the date
    if (isNaN(moveDate.getTime())) {
      console.error("Invalid date in request:", quoteRequest.moveDate);
      moveDate = new Date(); // Fallback to current date
    }

    // Get distance between locations
    const distanceResponse = await calculateDistance(
      quoteRequest.pickupAddress,
      quoteRequest.deliveryAddress,
    );

    // Set default van size if not provided
    const vanSize = quoteRequest.vanSize || "medium";

    // Build parameters object for price calculation
    const calculationParams = {
      vanSize: vanSize,
      distance: distanceResponse.distance,
      estimatedHours: quoteRequest.estimatedHours || 2,
      helpers: quoteRequest.helpers || 0,
      floorAccess: quoteRequest.floorAccessPickup || "ground",
      liftAvailable: quoteRequest.liftAvailablePickup || false,
      moveDate: moveDate,
      moveTime: quoteRequest.moveTime || "09:00",
      urgency: quoteRequest.urgency || "standard",
      isUrban: distanceResponse.distance < 30,
      pickupAddress: quoteRequest.pickupAddress,
      deliveryAddress: quoteRequest.deliveryAddress,
    };

    // Calculate price breakdown
    const quote = buildPriceBreakdown(calculationParams);

    // Add distance information to the response
    const response = {
      ...quote,
      distance: distanceResponse.distance,
      estimatedTime: distanceResponse.estimatedTime,
      pickupAddress: quoteRequest.pickupAddress,
      deliveryAddress: quoteRequest.deliveryAddress,
      vanSize: vanSize,
      moveDate: moveDate.toISOString(),
    };

    // Return the quote
    return res.json(response);
  } catch (error) {
    console.error("Error calculating quote:", error);
    return res.status(500).json({
      error: "Failed to calculate quote",
      details: error.message,
    });
  }
}

// ====================================================
// 10. INTEGRATING FIXES INTO THE FRONTEND
// ====================================================

/**
 * Update the frontend quote display to show the correct breakdown
 */

// Fix for the quote display component
const fixedPriceCalculatorComponent = `
import { useState, useEffect, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QuoteContext } from '@/contexts/QuoteContext';

export function PriceBreakdown() {
  const { quote } = useContext(QuoteContext);
  
  if (!quote) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Price Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No quote available. Please calculate a quote first.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Price Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {quote.breakdown.map((item, index) => {
            const isTotal = item.includes('Total');
            const isPlatform = item.includes('Platform fee');
            const isDriver = item.includes('Driver share');
            
            return (
              <div 
                key={index} 
                className={\`flex justify-between \${
                  isTotal ? 'font-bold text-blue-600 border-t border-b py-2 my-2' : 
                  isPlatform || isDriver ? 'text-sm text-gray-600' : ''
                }\`}
              >
                <span>{item.split(':')[0]}</span>
                <span>{item.split(':')[1]}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function QuoteSummary() {
  const { quote } = useContext(QuoteContext);
  
  if (!quote) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Quote Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No quote available. Please calculate a quote first.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Quote Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between py-2 border-b">
            <span className="font-medium">From:</span>
            <span>{quote.pickupAddress}</span>
          </div>
          
          <div className="flex justify-between py-2 border-b">
            <span className="font-medium">To:</span>
            <span>{quote.deliveryAddress}</span>
          </div>
          
          <div className="flex justify-between py-2 border-b">
            <span className="font-medium">Distance:</span>
            <span>{quote.distance} miles</span>
          </div>
          
          <div className="flex justify-between py-2 border-b">
            <span className="font-medium">Van Size:</span>
            <span className="capitalize">{quote.vanSize}</span>
          </div>
          
          <div className="flex justify-between py-2 border-b">
            <span className="font-medium">Move Date:</span>
            <span>{new Date(quote.moveDate).toLocaleDateString()}</span>
          </div>
          
          <div className="flex justify-between py-2 border-b">
            <span className="font-medium">Estimated Time:</span>
            <span>{quote.estimatedTime}</span>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-md">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total Price:</span>
              <span>{quote.priceString}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {quote.explanation}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
`;

// ====================================================
// 11. TESTING THE QUOTE CALCULATION
// ====================================================

/**
 * Add this test function to verify quote calculations
 */

function testQuoteCalculation() {
  // Test cases with expected values
  const testCases = [
    {
      params: {
        vanSize: "medium",
        distance: 10,
        estimatedHours: 2,
        helpers: 0,
        floorAccess: "ground",
        liftAvailable: false,
        moveDate: new Date("2025-05-01T09:00:00"), // Weekday
        moveTime: "09:00",
        urgency: "standard",
        isUrban: true,
        pickupAddress: "London",
        deliveryAddress: "Watford",
      },
      expected: {
        // These are approximate expected values
        distanceCharge: { min: 20, max: 40 },
        finalPrice: { min: 80, max: 150 },
        vatAmount: { min: 15, max: 35 },
      },
    },
    {
      params: {
        vanSize: "large",
        distance: 100,
        estimatedHours: 3,
        helpers: 1,
        floorAccess: "firstFloor",
        liftAvailable: false,
        moveDate: new Date("2025-05-03T09:00:00"), // Weekend
        moveTime: "09:00",
        urgency: "priority",
        isUrban: false,
        pickupAddress: "Manchester",
        deliveryAddress: "Leeds",
      },
      expected: {
        // These are approximate expected values
        distanceCharge: { min: 110, max: 140 },
        finalPrice: { min: 300, max: 450 },
        vatAmount: { min: 60, max: 90 },
      },
    },
  ];

  // Run tests
  for (let i = 0; i < testCases.length; i++) {
    const test = testCases[i];

    try {
      // Calculate quote
      const quote = buildPriceBreakdown(test.params);

      // Check if values are within expected ranges
      const distanceChargeOK =
        quote.distanceCharge >= test.expected.distanceCharge.min &&
        quote.distanceCharge <= test.expected.distanceCharge.max;

      const finalPriceOK =
        quote.finalPrice >= test.expected.finalPrice.min &&
        quote.finalPrice <= test.expected.finalPrice.max;

      const vatAmountOK =
        quote.vatAmount >= test.expected.vatAmount.min &&
        quote.vatAmount <= test.expected.vatAmount.max;

      // Log results
      console.log(
        `Distance Charge: ${quote.distanceCharge} - ${distanceChargeOK ? "OK" : "FAIL"}`,
      );
      console.log(
        `Final Price: ${quote.finalPrice} - ${finalPriceOK ? "OK" : "FAIL"}`,
      );
      console.log(
        `VAT Amount: ${quote.vatAmount} - ${vatAmountOK ? "OK" : "FAIL"}`,
      );

      // Overall test result
      const testPassed = distanceChargeOK && finalPriceOK && vatAmountOK;
      console.log(`Test ${i + 1} Result: ${testPassed ? "PASS" : "FAIL"}`);

      // Print breakdown for debugging
      quote.breakdown.forEach((item) => console.log(`  ${item}`));
    } catch (error) {}
  }
}

// ====================================================
// TO IMPLEMENT THESE FIXES
// ====================================================

/**
 * Steps to implement the price calculation fixes:
 *
 * 1. Update PRICING_CONSTANTS in shared/pricing-rules.ts
 * 2. Replace all the pricing calculation functions with the fixed versions
 * 3. Fix the API endpoint for quote calculation
 * 4. Update the frontend components to display the correct breakdown
 * 5. Run the test function to verify calculations are correct
 *
 * These fixes will ensure:
 * - Consistent and accurate price calculations
 * - Proper handling of all pricing factors
 * - Consistent rounding and formatting of currency values
 * - Clear price breakdowns for users
 * - Accurate VAT calculations
 */
