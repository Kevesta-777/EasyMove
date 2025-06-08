/**
 * PRICING RULES - CENTRALIZED PRICING MODULE
 * Single source of truth for all pricing calculations across the application
 */

import { updateUserAgent } from "@paypal/paypal-server-sdk/dist/types/core";

export type VanSize = "small" | "medium" | "large" | "luton";
export type FloorAccess =
  | "ground"
  | "firstFloor"
  | "secondFloor"
  | "thirdFloorPlus";
export type UrgencyLevel = "standard" | "priority" | "express";

// Base pricing constants - updated based on new requirements
export const PRICING_CONSTANTS = {
  // Base fare and distance-based pricing
  BASE_FARE: 15, // £15 base fare for all jobs
  BASE_RATE_PER_MILE_MIN: 1.75, // £1.75 per mile (matches COST_PER_MILE)
  BASE_RATE_PER_MILE_MAX: 2.0, // £2.00 per mile (maximum)
  MINIMUM_DISTANCE_CHARGE: 5, // Minimum distance charge in miles

  // Van capacities and details
  VAN_CAPACITIES: {
    small: {
      capacity: "40-50 cubic feet",
      description: "Ideal for small deliveries and single items",
    },
    medium: {
      capacity: "80-100 cubic feet",
      description: "Good for small house moves (1-2 rooms)",
    },
    large: {
      capacity: "150-170 cubic feet",
      description: "Suitable for average house moves (2-3 rooms)",
    },
    luton: {
      capacity: "550-600 cubic feet",
      description: "Best for full house moves and large items",
    },
  },

  // Time and labor costs - updated according to requirements
  // HOURLY_RATES: {
  //   small: 25, // £25/hour (minimum labour rate)
  //   medium: 28, // £28/hour
  //   large: 32, // £32/hour
  //   luton: 35, // £35/hour (maximum labour rate)
  // },

  HOURLY_RATES: {
    small: 1.0, // £25/hour (minimum labour rate)
    medium: 1.1, // £28/hour
    large: 1.2, // £32/hour
    luton: 1.3, // £35/hour (maximum labour rate)
  },

  // Helper costs
  HELPER_HOURLY_RATE: 25, // £25 per hour per helper

  // Access charges
  FLOOR_ACCESS_FEES: {
    ground: 0,
    firstFloor: 10, // £10 for first floor
    secondFloor: 20, // £20 for second floor
    thirdFloorPlus: 30, // £30 for third floor or higher
  },
  LIFT_DISCOUNT: 0.5, // 50% discount if lift is available

  // Surcharges
  CONGESTION_CHARGE: 15, // £15 London congestion charge
  PEAK_TIME_SURCHARGES: {
    weekend: 0.08, // 8% surcharge on weekends
    evening: 0.05, // 5% surcharge for evening moves
    holiday: 0.1, // 10% surcharge on holidays
    normal: 0, // No surcharge for normal hours
  },
  URGENCY_SURCHARGES: {
    standard: 0, // No surcharge for standard service
    priority: 0.15, // 15% surcharge for priority service
    express: 0.3, // 30% surcharge for express service
  },

  // Fuel and operational costs
  FUEL_PRICE_PER_LITRE: 1.5, // £1.50 per litre
  AVERAGE_MPG: {
    small: 35, // small van - better fuel efficiency
    medium: 32, // medium van
    large: 28, // large van
    luton: 24, // luton van - worst fuel efficiency
  },
  RETURN_JOURNEY_FACTOR: 0.3, // Return journey at 30% of outbound

  // Van size multipliers - updated according to requirements
  VAN_SIZE_MULTIPLIERS: {
    small: 1.0, // SWB - Base rate (Small Wheel Base)
    medium: 1.1, // MWB - 20% more than small (Medium Wheel Base)
    large: 1.2, // LWB - 40% more than small (Long Wheel Base)
    luton: 1.3, // Luton - 60% more than small
  },

  // Loading/unloading times (in hours)
  BASE_LOADING_TIMES: {
    small: 0.5, // 30 minutes
    medium: 0.75, // 45 minutes
    large: 1.0, // 60 minutes
    luton: 1.25, // 75 minutes
  },

  // Minimum price thresholds
  MINIMUM_PRICE: 40, // Minimum price for any delivery
  MINIMUM_DRIVER_PERCENTAGE: 0.75, // Driver gets 75% of the total
  PLATFORM_FEE_PERCENTAGE: 0.25, // Platform takes 25% commission

  // VAT
  VAT_RATE: 0.2, // 20% VAT

  // Miscellaneous
  CURRENCY: "£", // Default currency symbol
};

/**
 * Calculate the distance-based charge
 * This now includes a base fare and per-mile rate that varies with location and van size
 */
export function calculateDistanceCharge(
  distanceMiles: number,
  vanSize: VanSize = "medium",
  isUrban: boolean = false,
): number {
  // Start with the base fare
  let charge = PRICING_CONSTANTS.BASE_FARE;

  // Apply the base rate per mile with a minimum distance
  const effectiveDistance = Math.max(
    distanceMiles,
    PRICING_CONSTANTS.MINIMUM_DISTANCE_CHARGE,
  );

  // Determine per-mile rate based on location (urban vs rural) and van size
  let perMileRate;
  const sizeFactor = calculateVanSizeMultiplier(vanSize);

  // Urban areas are charged more due to traffic, parking challenges, etc.
  if (isUrban) {
    perMileRate = PRICING_CONSTANTS.BASE_RATE_PER_MILE_MAX; // £2.00 per mile for urban areas
  } else {
    // For rural or standard areas, use lower rate but adjust based on distance
    // Shorter distances have higher per-mile costs
    const distanceFactor = Math.min(1, 20 / effectiveDistance);
    perMileRate =
      PRICING_CONSTANTS.BASE_RATE_PER_MILE_MIN +
      (PRICING_CONSTANTS.BASE_RATE_PER_MILE_MAX -
        PRICING_CONSTANTS.BASE_RATE_PER_MILE_MIN) *
        distanceFactor;
  }

  // Calculate fuel cost per mile to incorporate into the per-mile rate
  // MPG and fuel calculation integrated directly into distance charge
  const mpg =
    PRICING_CONSTANTS.AVERAGE_MPG[vanSize] ||
    PRICING_CONSTANTS.AVERAGE_MPG.medium;
  const litresPerGallon = 4.54609; // UK gallon
  const fuelCostPerMile =
    (1 / mpg) * PRICING_CONSTANTS.FUEL_PRICE_PER_LITRE * litresPerGallon;

  // Add fuel cost to the per-mile rate
  const totalPerMileRate = perMileRate + fuelCostPerMile;

  // Apply van size multiplier to the total per-mile rate
  const adjustedPerMileRate = totalPerMileRate * sizeFactor;
  // Add the distance charge (now includes fuel)
  // charge += effectiveDistance * adjustedPerMileRate;
  charge = effectiveDistance * 1.2;
  return charge;
}

/**
 * Calculate the van size multiplier
 */
export function calculateVanSizeMultiplier(vanSize: VanSize): number {
  return (
    PRICING_CONSTANTS.VAN_SIZE_MULTIPLIERS[vanSize] ||
    PRICING_CONSTANTS.VAN_SIZE_MULTIPLIERS.small
  );
}

/**
 * Calculate the hourly rate based on van size
 */
export function calculateHourlyRate(vanSize: VanSize): number {
  return PRICING_CONSTANTS.HOURLY_RATES[vanSize];
  // PRICING_CONSTANTS.HOURLY_RATES.small
}

/**
 * Calculate time-based charges (hourly rate × time)
 */
// export function calculateTimeCharge(vanSize: VanSize, hours: number): number {
//   const hourlyRate = calculateHourlyRate(vanSize);
//   return hourlyRate * hours;
// }

export function calculateTimeCharge(
  vanSize: VanSize,
  returnJourneyCost: number,
  distanceCharge: number,
): number {
  const hourlyRate = calculateHourlyRate(vanSize);
  const charge = distanceCharge + returnJourneyCost;
  const Van = hourlyRate * distanceCharge;
  return Van;
}

/**
 * Calculate loading time based on van size, access conditions, and items
 */
export function calculateLoadingTime(
  vanSize: VanSize,
  hasStairs: boolean,
  itemsCount: number = 10, // Default to medium sized move
): number {
  // Base loading times in hours for each van size (assuming good access)
  const baseLoadingTime = PRICING_CONSTANTS.BASE_LOADING_TIMES[vanSize];

  // Multiplier for stairs vs good access
  const accessMultiplier = hasStairs ? 1.5 : 1;

  // Adjust for the number of items (normalized around 10 items)
  const itemsMultiplier = Math.max(0.5, Math.min(2, itemsCount / 10));

  // Calculate loading time (doubled to account for both loading and unloading)
  return baseLoadingTime * accessMultiplier * itemsMultiplier * 2;
}

/**
 * Calculate helper charges
 */
export function calculateHelperFee(numHelpers: number, hours: number): number {
  return PRICING_CONSTANTS.HELPER_HOURLY_RATE * numHelpers * hours;
}

/**
 * Calculate floor access charges
 */
export function calculateFloorAccessFee(
  floorAccess: FloorAccess,
  liftAvailable: boolean,
): number {
  const baseFee = PRICING_CONSTANTS.FLOOR_ACCESS_FEES[floorAccess];
  return liftAvailable ? baseFee * PRICING_CONSTANTS.LIFT_DISCOUNT : baseFee;
}

/**
 * Calculate peak time surcharge (weekend, evening, holiday)
 */
export function calculatePeakTimeSurcharge(
  date: Date,
  timeString?: string,
): number {
  const day = date.getDay();
  const isWeekend = day === 0 || day === 6; // 0 = Sunday, 6 = Saturday

  // Check if it's an evening move if time is provided
  let isEvening = false;
  if (timeString) {
    const [hours] = timeString.split(":").map(Number);
    isEvening = hours >= 18 || hours < 7; // After 6pm or before 7am
  } else {
    const hours = date.getHours();
    isEvening = hours >= 18 || hours < 7;
  }

  // UK holidays - simplified check based on known holiday dates
  // In a real app, this would be a more comprehensive holiday calendar
  const isHoliday = isUKHoliday(date);

  if (isHoliday) {
    return PRICING_CONSTANTS.PEAK_TIME_SURCHARGES.holiday;
  } else if (isWeekend) {
    return PRICING_CONSTANTS.PEAK_TIME_SURCHARGES.weekend;
  } else if (isEvening) {
    return PRICING_CONSTANTS.PEAK_TIME_SURCHARGES.evening;
  }

  return PRICING_CONSTANTS.PEAK_TIME_SURCHARGES.normal;
}

/**
 * Calculate urgency surcharge
 */
export function calculateUrgencySurcharge(urgency: UrgencyLevel): number {
  return PRICING_CONSTANTS.URGENCY_SURCHARGES[urgency] || 0;
}

/**
 * Calculate fuel costs for the journey using MPG formula
 * Fuel formula: (distance_miles / mpg) * fuel_cost_per_litre * litres_per_gallon
 */
export function calculateFuelCost(
  distanceMiles: number,
  vanSize: VanSize = "medium",
): number {
  // UK gallon is 4.54609 litres
  const litresPerGallon = 4.54609;

  // Get the MPG for this van size from our constants
  const mpg =
    PRICING_CONSTANTS.AVERAGE_MPG[vanSize] ||
    PRICING_CONSTANTS.AVERAGE_MPG.medium;

  // Calculate fuel cost: (distance / mpg) * cost per litre * litres per gallon
  return (
    (distanceMiles / mpg) *
    PRICING_CONSTANTS.FUEL_PRICE_PER_LITRE *
    litresPerGallon
  );
}

/**
 * Calculate return journey costs
 *
 * The return journey is charged at a reduced rate with several considerations:
 * - No base fare for the return (driver is already out)
 * - Use the lowest per-mile rate since it's typically efficient and less traffic
 * - Apply the return journey factor as set in pricing constants
 */
export function calculateReturnJourneyCost(
  distanceMiles: number,
  vanSize: VanSize = "medium",
): number {
  // Use effective distance - same as main distance charge calculation
  const effectiveDistance = Math.max(
    distanceMiles,
    PRICING_CONSTANTS.MINIMUM_DISTANCE_CHARGE,
  );
  const sizeFactor = calculateVanSizeMultiplier(vanSize);

  // Use the lowest per-mile rate for return journey (more efficient, less traffic)
  const returnRate = PRICING_CONSTANTS.BASE_RATE_PER_MILE_MIN;

  // Apply size factor to the rate
  const adjustedRate = returnRate * sizeFactor;

  // Calculate return journey cost and apply the return journey factor
  const returnCost =
    effectiveDistance * adjustedRate * PRICING_CONSTANTS.RETURN_JOURNEY_FACTOR;

  // Round to avoid floating point issues and improve consistency
  return Math.round(returnCost * 100) / 100;
}

/**
 * Check if a date is a UK holiday (simplified version)
 */
function isUKHoliday(date: Date): boolean {
  const month = date.getMonth(); // 0-11
  const day = date.getDate(); // 1-31

  // Check for major UK holidays (simplified)
  // New Year's Day
  if (
    (month === 0 && day === 1) ||
    (month === 0 && day === 2 && date.getDay() === 1)
  )
    return true;

  // Christmas and Boxing Day
  if ((month === 11 && day === 25) || (month === 11 && day === 26)) return true;

  // Add more UK holidays as needed

  return false;
}

/**
 * Calculate commission and driver share
 * The platform fee is 25% and driver gets 75%
 */
export function calculateCommissionAndDriverShare(totalPrice: number): {
  platformFee: number;
} {
  // Calculate standard platform fee (25%)
  let platformFee = totalPrice * PRICING_CONSTANTS.PLATFORM_FEE_PERCENTAGE;
  // No adjustment needed since our platform fee is already set to 25%

  return {
    platformFee: Math.round(platformFee * 100) / 100,
  };
}

/**
 * Calculate VAT amount from a gross price (VAT-inclusive)
 */
export function calculateVAT(price: number): number {
  // For a price that already includes VAT, we need to extract the VAT portion
  // Formula: price - (price / (1 + VAT_RATE))
  // With 20% VAT rate, VAT is exactly 1/6 of the gross price
  // Always round up to ensure the math works perfectly and consistently
  return Math.ceil((price / 6) * 100) / 100;
}

/**
 * Calculate price including VAT
 */
export function calculatePriceWithVAT(price: number): number {
  // Apply VAT and round to whole pounds (ceiling)
  return Math.ceil(price * (1 + PRICING_CONSTANTS.VAT_RATE));
}

/**
 * Format price with currency symbol
 */
export function formatPrice(price: number): string {
  return `${PRICING_CONSTANTS.CURRENCY}${price.toFixed(2)}`;
}

/**
 * Format time duration in hours and minutes
 */
export function formatDuration(hours: number): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);

  if (minutes === 0) {
    return `${wholeHours} hour${wholeHours !== 1 ? "s" : ""}`;
  } else if (wholeHours === 0) {
    return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  } else {
    return `${wholeHours} hour${wholeHours !== 1 ? "s" : ""} and ${minutes} minute${minutes !== 1 ? "s" : ""}`;
  }
}

/**
 * Estimate travel time based on distance and conditions
 * Enhanced with more accurate time calculations for different regions and times of day
 */
export function estimateTravelTime(
  distanceMiles: number,
  moveDate?: Date,
): number {
  // Get time of day if date is provided (to factor in peak traffic times)
  let timeOfDay: "early" | "peak" | "normal" | "late" = "normal";
  if (moveDate) {
    const hours = moveDate.getHours();
    if (hours >= 7 && hours < 10)
      timeOfDay = "peak"; // Morning rush hour
    else if (hours >= 16 && hours < 19)
      timeOfDay = "peak"; // Evening rush hour
    else if (hours >= 22 || hours < 5)
      timeOfDay = "late"; // Late night
    else if (hours >= 5 && hours < 7) timeOfDay = "early"; // Early morning
  }

  // Base speed calculation
  let baseSpeed =
    distanceMiles < 10
      ? 18 // Urban: 18mph
      : distanceMiles < 30
        ? 25 // Suburban: 25mph
        : distanceMiles < 100
          ? 35 // Regional: 35mph
          : 45; // Highway: 45mph

  // Adjust for time of day
  const speedAdjustment =
    timeOfDay === "peak"
      ? 0.7 // 30% slower during peak hours
      : timeOfDay === "late"
        ? 1.3 // 30% faster during late night
        : timeOfDay === "early"
          ? 1.2 // 20% faster during early morning
          : 1.0; // Normal speed otherwise

  // Calculate adjusted speed
  const adjustedSpeed = baseSpeed * speedAdjustment;

  // Base driving time with adjusted speed
  const drivingTime = distanceMiles / adjustedSpeed;

  // Add loading/unloading buffer based on distance (more items likely for longer distance)
  const loadingBuffer =
    distanceMiles < 20
      ? 0.5 // 30 minutes for short moves
      : distanceMiles < 50
        ? 0.75 // 45 minutes for medium moves
        : 1.0; // 1 hour for long moves

  // Add mandatory breaks for longer journeys (1 break per 2 hours of driving)
  const breakTime = distanceMiles > 50 ? Math.floor(drivingTime / 2) * 0.25 : 0;

  // Add potential delay time for unforeseen circumstances (traffic incidents, etc.)
  // 5% of driving time for shorter journeys, 10% for longer ones
  const delayBuffer = drivingTime * (distanceMiles > 100 ? 0.1 : 0.05);

  // Total estimated time: driving + breaks + loading/unloading + potential delays
  return drivingTime + breakTime + loadingBuffer + delayBuffer;
}

/**
 * Build a detailed price breakdown
 */
export function buildPriceBreakdown(params: {
  distanceMiles: number;
  vanSize: VanSize;
  estimatedHours: number;
  numHelpers: number;
  floorAccess: FloorAccess;
  liftAvailable: boolean;
  moveDate: Date;
  moveTime?: string;
  urgency: UrgencyLevel;
  inLondon?: boolean;
}): {
  totalPrice: number;
  distanceCharge: number;
  timeCharge: number;
  helpersFee: number;
  floorAccessFee: number;
  peakTimeSurcharge: number;
  urgencySurcharge: number;
  fuelCost: number;
  returnJourneyCost: number;
  congestionCharge: number;
  vanSizeMultiplier: number;
  currency: string;
  estimatedTime: string;
  platformFee: number;
  driverShare: number;
  vatAmount: number;
  totalWithVAT: number;
  breakdown: string[];
} {
  const {
    distanceMiles,
    vanSize,
    estimatedHours,
    numHelpers,
    floorAccess,
    liftAvailable,
    moveDate,
    moveTime,
    urgency,
    inLondon = false,
  } = params;

  // Calculate base charges
  const distanceCharge = calculateDistanceCharge(
    distanceMiles,
    vanSize,
    inLondon,
  );
  // const returnJourneyCost = calculateReturnJourneyCost(distanceMiles, vanSize);
  const returnJourneyCost = distanceCharge * 0.2;

  // const vanSizeMultiplier = calculateVanSizeMultiplier(vanSize);
  const vanSizeMultiplier = calculateVanSizeMultiplier(vanSize);

  // const timeCharge = calculateTimeCharge(vanSize, estimatedHours);
  const timeCharge = calculateTimeCharge(
    vanSize,
    returnJourneyCost,
    distanceCharge,
  );

  // Calculate additional fees
  const helpersFee = calculateHelperFee(numHelpers, estimatedHours);
  const floorAccessFee = calculateFloorAccessFee(floorAccess, liftAvailable);
  const fuelCost = calculateFuelCost(distanceMiles, vanSize);
  const congestionCharge = inLondon ? PRICING_CONSTANTS.CONGESTION_CHARGE : 0;

  // Calculate surcharges
  const peakTimeSurchargeRate = calculatePeakTimeSurcharge(moveDate, moveTime);
  const urgencySurchargeRate = calculateUrgencySurcharge(urgency);

  // Subtotal before surcharges
  const subtotal =
    distanceCharge +
    // timeCharge +
    // helpersFee +
    // floorAccessFee +
    // fuelCost +
    returnJourneyCost;
  // congestionCharge;

  // Apply surcharges
  const peakTimeSurcharge = subtotal * peakTimeSurchargeRate;
  const urgencySurcharge = subtotal * urgencySurchargeRate;

  // Calculate total price
  let totalPrice = subtotal + peakTimeSurcharge + urgencySurcharge;
  // Ensure minimum price threshold
  totalPrice = Math.max(totalPrice, PRICING_CONSTANTS.MINIMUM_PRICE);

  // Round to whole pounds for simplicity
  totalPrice = Math.ceil(totalPrice);

  // Calculate subtotal before VAT
  const subtotalBeforeVAT = totalPrice;

  // Calculate total with VAT first (exactly 20% more than subtotal)
  const totalWithVAT = subtotalBeforeVAT;

  // Calculate platform fee and driver share
  const { platformFee } = calculateCommissionAndDriverShare(subtotalBeforeVAT);

  // Calculate VAT amount explicitly (20% of pre-VAT amount)
  const vatAmount = Math.ceil(platformFee * 0.2);
  const platformPayment = platformFee + vatAmount;
  const driverShare = subtotalBeforeVAT - (platformFee + vatAmount);

  // Create a breakdown array of charges
  const breakdown = [
    `Distance (${distanceMiles.toFixed(1)} miles): ${formatPrice(distanceCharge)}`,
    `Van size (${vanSize}): ${formatPrice(timeCharge)}`,
    `Helpers (${numHelpers}): ${formatPrice(helpersFee)}`,
    floorAccessFee > 0
      ? `Floor access (${floorAccess}): ${formatPrice(floorAccessFee)}`
      : null,
    // `Fuel: ${formatPrice(fuelCost)}`,
    `Return journey: ${formatPrice(returnJourneyCost)}`,
    congestionCharge > 0
      ? `Congestion charge: ${formatPrice(congestionCharge)}`
      : null,
    peakTimeSurcharge > 0
      ? `Peak time surcharge (${(peakTimeSurchargeRate * 100).toFixed(0)}%): ${formatPrice(peakTimeSurcharge)}`
      : null,
    urgencySurcharge > 0
      ? `${urgency} service (${(urgencySurchargeRate * 100).toFixed(0)}%): ${formatPrice(urgencySurcharge)}`
      : null,
    `Total: ${formatPrice(subtotalBeforeVAT)}`,
    `VAT (${(PRICING_CONSTANTS.VAT_RATE * 100).toFixed(0)}%): ${formatPrice(vatAmount)}`,
    // `Total (including VAT): ${formatPrice(totalWithVAT)}`,
    `Platform fee (25%): ${formatPrice(platformFee)}`,
    `Platform payment: ${formatPrice(platformPayment)}`,
    `Driver payment (75%): ${formatPrice(driverShare)}`,
  ].filter(Boolean) as string[];
  // Format estimated time with more accurate calculation
  // const travelTime = estimateTravelTime(distanceMiles, moveDate);
  // const loadingTime = calculateLoadingTime(
  //   vanSize,
  //   floorAccess !== "ground" && !liftAvailable,
  // );
  const totalTime = estimatedHours;
  const estimatedTime = formatDuration(totalTime);
  return {
    totalPrice,
    distanceCharge,
    timeCharge,
    helpersFee,
    floorAccessFee,
    peakTimeSurcharge,
    urgencySurcharge,
    fuelCost,
    returnJourneyCost,
    congestionCharge,
    vanSizeMultiplier,
    currency: PRICING_CONSTANTS.CURRENCY,
    estimatedTime,
    platformFee,
    driverShare,
    vatAmount,
    totalWithVAT,
    breakdown,
  };
}

/**
 * Simplified quote calculation for the landing page
 */
export function calculateSimpleQuote(params: {
  distanceMiles: number;
  vanSize: VanSize;
  moveDate: Date;
}) {
  const { distanceMiles, vanSize, moveDate } = params;

  // Calculate a more accurate estimate of hours based on distance
  // For short distances, minimum 2 hours
  // For medium distances, scale with diminishing returns
  // For long distances, cap the hours at a reasonable amount
  let estimatedHours: number;

  if (distanceMiles < 20) {
    // Short distance: minimum 2 hours
    estimatedHours = 2;
  } else if (distanceMiles < 100) {
    // Medium distance: gradually scale up (slower than linear)
    estimatedHours = 2 + (distanceMiles - 20) / 25;
  } else if (distanceMiles < 200) {
    // Longer distance: slower rate of increase
    estimatedHours = 5 + (distanceMiles - 100) / 50;
  } else {
    // Very long distance: cap at reasonable amount
    estimatedHours = 7 + (distanceMiles - 200) / 100;
  }

  // Round to nearest 0.5 hours for simplicity
  estimatedHours = Math.round(estimatedHours * 2) / 2;

  // Placeholder for London detection - we would need to check addresses correctly
  // In a real app, this would check pickup/delivery addresses against London postcodes
  const inLondon = false; // No longer using this incorrect approach

  // Use the detailed calculator with our improved estimate
  const detailedQuote = buildPriceBreakdown({
    distanceMiles,
    vanSize,
    estimatedHours,
    numHelpers: 0,
    floorAccess: "ground",
    liftAvailable: false,
    moveDate,
    urgency: "standard",
    inLondon,
  });

  // Return the full quote object for consistency, always using VAT-inclusive prices
  return {
    ...detailedQuote,
    // Use VAT-inclusive price for all price fields
    price: detailedQuote.totalWithVAT,
    priceString: formatPrice(detailedQuote.totalWithVAT),
    explanation: `${formatPrice(detailedQuote.totalWithVAT)} for a ${vanSize} van, ${distanceMiles.toFixed(1)} miles. Estimated time: ${detailedQuote.estimatedTime}.`,
    subTotal: detailedQuote.driverShare,
    // Set originalPrice and finalPrice for consistency with other parts of the app
    originalPrice: detailedQuote.totalWithVAT,
    finalPrice: detailedQuote.totalWithVAT,
  };
}
