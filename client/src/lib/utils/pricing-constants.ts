// Pricing constants for the EasyMove quote calculator
// These values can be easily adjusted to tune pricing model

export const PRICING_CONSTANTS = {
  // Base rate per mile (in GBP)
  BASE_RATE_PER_MILE: 2.0,
  
  // Minimum price regardless of distance/time
  MINIMUM_PRICE: 50,
  
  // Base hourly rates for each van size (in GBP)
  HOURLY_RATES: {
    small: 35,
    medium: 45,
    large: 55, 
    luton: 65,
  },
  
  // Additional helper rates per hour (in GBP)
  HELPER_HOURLY_RATE: 20,
  
  // Time multipliers for peak hours
  PEAK_TIME_MULTIPLIERS: {
    // Weekend multiplier
    weekend: 1.25,
    // Evening hours (after 6pm) multiplier
    evening: 1.15,
    // Early morning (before 8am) multiplier
    earlyMorning: 1.1,
    // Holiday multiplier (can be populated with UK bank holidays)
    holiday: 1.3,
  },
  
  // Floor access difficulty additional fixed charges (in GBP)
  FLOOR_ACCESS_CHARGES: {
    ground: 0,
    firstFloor: 15,
    secondFloor: 25,
    thirdFloorPlus: 35,
    noLift: 20, // Additional charge if building has no lift/elevator
  },
  
  // Van size capacity details for reference (cubic meters)
  VAN_CAPACITIES: {
    small: {
      capacity: "5-6 cubic meters",
      description: "Ideal for small moves, single items, or student moves",
      maxLoad: "600kg",
    },
    medium: {
      capacity: "10-11 cubic meters",
      description: "Suitable for studio or 1-bedroom flat moves",
      maxLoad: "1000kg",
    },
    large: {
      capacity: "14-15 cubic meters",
      description: "Good for 2-bedroom flat or small house moves",
      maxLoad: "1200kg",
    },
    luton: {
      capacity: "19-20 cubic meters",
      description: "Perfect for 3-bedroom house moves or large furniture",
      maxLoad: "1400kg",
    },
  },
  
  // Fuel efficiency estimates by van size (miles per gallon)
  FUEL_EFFICIENCY: {
    small: 35,
    medium: 30,
    large: 27,
    luton: 25,
  },
  
  // Average fuel price per gallon (GBP) - updated regularly
  FUEL_PRICE_PER_GALLON: 7.0, // Approx. £1.60/liter * 4.54 liters/gallon
  
  // Loading/unloading time estimates (minutes)
  LOADING_TIME: {
    base: 30, // Base loading time
    perHelper: -5, // Time reduction per helper (negative value)
    perFloor: 10, // Additional time per floor
  },
  
  // Distance adjustment factors
  DISTANCE_FACTORS: {
    // Road winding factor (actual road distance vs straight line)
    shortDistance: 1.4, // Under 10 miles
    mediumDistance: 1.3, // 10-30 miles
    longDistance: 1.2, // 30-100 miles
    veryLongDistance: 1.1, // Over 100 miles
  },
  
  // Average speeds based on distance (mph)
  AVERAGE_SPEEDS: {
    shortDistance: 20, // Urban driving
    mediumDistance: 30, // Mixed urban/suburban
    longDistance: 45, // Mixed suburban/highway
    veryLongDistance: 55, // Primarily highway
  },
  
  // Congestion charges and tolls
  CONGESTION_CHARGE: 15, // London congestion charge
  
  // Return journey compensation factor
  RETURN_JOURNEY_FACTOR: {
    shortDistance: 0.4, // Under 10 miles (40% of base price)
    mediumDistance: 0.3, // 10-30 miles (30% of base price)
    longDistance: 0.25, // Over 30 miles (25% of base price)
  },
};

// UK bank holidays for reference (2025)
export const UK_BANK_HOLIDAYS_2025 = [
  new Date("2025-01-01"), // New Year's Day
  new Date("2025-04-18"), // Good Friday
  new Date("2025-04-21"), // Easter Monday
  new Date("2025-05-05"), // Early May Bank Holiday
  new Date("2025-05-26"), // Spring Bank Holiday
  new Date("2025-08-25"), // Summer Bank Holiday
  new Date("2025-12-25"), // Christmas Day
  new Date("2025-12-26"), // Boxing Day
];

// Function to check if a date is a UK bank holiday
export function isUKBankHoliday(date: Date): boolean {
  return UK_BANK_HOLIDAYS_2025.some(holiday => 
    holiday.getDate() === date.getDate() && 
    holiday.getMonth() === date.getMonth() && 
    holiday.getFullYear() === date.getFullYear()
  );
}

// Helper functions for pricing calculations

// Get road distance adjustment factor based on straight-line distance
export function getRoadDistanceFactor(distance: number): number {
  if (distance < 10) return PRICING_CONSTANTS.DISTANCE_FACTORS.shortDistance;
  if (distance < 30) return PRICING_CONSTANTS.DISTANCE_FACTORS.mediumDistance;
  if (distance < 100) return PRICING_CONSTANTS.DISTANCE_FACTORS.longDistance;
  return PRICING_CONSTANTS.DISTANCE_FACTORS.veryLongDistance;
}

// Get average speed based on distance
export function getAverageSpeed(distance: number): number {
  if (distance < 10) return PRICING_CONSTANTS.AVERAGE_SPEEDS.shortDistance;
  if (distance < 30) return PRICING_CONSTANTS.AVERAGE_SPEEDS.mediumDistance;
  if (distance < 100) return PRICING_CONSTANTS.AVERAGE_SPEEDS.longDistance;
  return PRICING_CONSTANTS.AVERAGE_SPEEDS.veryLongDistance;
}

// Get return journey compensation factor
export function getReturnJourneyFactor(distance: number): number {
  if (distance < 10) return PRICING_CONSTANTS.RETURN_JOURNEY_FACTOR.shortDistance;
  if (distance < 30) return PRICING_CONSTANTS.RETURN_JOURNEY_FACTOR.mediumDistance;
  return PRICING_CONSTANTS.RETURN_JOURNEY_FACTOR.longDistance;
}