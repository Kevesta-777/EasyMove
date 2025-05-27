// Export our own types for backward compatibility
export type VanSize = "small" | "medium" | "large" | "luton";
export type UrgencyLevel = "standard" | "priority" | "express";

// Basic types and interfaces for the old calculator
export interface CalculateQuoteParams {
  distance: number;
  vanSize: VanSize;
  moveDate: Date;
  urgency?: UrgencyLevel;
  collectionAddress?: string;
  deliveryAddress?: string;
}

export interface QuoteDetails {
  price: number;
  basePrice: number;
  distance: number;
  currency: string;
  estimatedTime: string;
  factors?: {
    vanSizeMultiplier: number;
    timeMultiplier: number;
    urgencyMultiplier: number;
  };
  explanation?: string;
}

// Constants for the old calculator - updated to match the new calculator
// Increased base price and mileage rates to ensure drivers are properly compensated
const BASE_PRICE = 70; // Increased from £50 to £70
const PRICE_PER_MILE = 3.0; // Increased from £2.50 to £3.00 per mile

// Updated multipliers to better reflect the actual price differences between van sizes
const VAN_SIZE_MULTIPLIERS: Record<VanSize, number> = {
  small: 1.0,  // Small van (no change)
  medium: 1.4, // Medium van (40% more)
  large: 1.8,  // Large van (80% more) 
  luton: 2.2   // Luton van (120% more)
};

const URGENCY_MULTIPLIERS: Record<string, number> = {
  standard: 1,
  priority: 1.25,
  express: 1.5
};

const WEEKEND_MODIFIER = 1.15;
const PEAK_HOUR_MODIFIER = 1.1;

// This is a backward compatibility function 
// to ensure existing code continues to work
export function calculateQuote(params: CalculateQuoteParams): QuoteDetails {
  const { 
    distance, 
    vanSize, 
    moveDate, 
    urgency = 'standard',
    collectionAddress = '',
    deliveryAddress = ''
  } = params;
  
  // Basic price calculation
  const basePrice = BASE_PRICE + (distance * PRICE_PER_MILE);
  let price = basePrice;
  
  // Apply van size multiplier
  const vanSizeMultiplier = VAN_SIZE_MULTIPLIERS[vanSize];
  price *= vanSizeMultiplier;
  
  // Check for weekend pricing
  const dayOfWeek = moveDate.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  let timeMultiplier = isWeekend ? WEEKEND_MODIFIER : 1;
  
  // Check for peak hour pricing
  const hourOfDay = moveDate.getHours();
  const isPeakHour = (hourOfDay >= 8 && hourOfDay < 10) || (hourOfDay >= 16 && hourOfDay < 19);
  if (isPeakHour) {
    timeMultiplier *= PEAK_HOUR_MODIFIER;
  }
  
  // Apply time multiplier
  price *= timeMultiplier;
  
  // Apply urgency multiplier
  const urgencyMultiplier = URGENCY_MULTIPLIERS[urgency] || 1;
  price *= urgencyMultiplier;
  
  // Round to nearest £10 for consistent pricing with the rest of the application
  price = Math.round(price / 10) * 10;
  
  // Calculate estimated time based on distance in a more realistic way
  // For long distances, driving takes longer per mile due to driver fatigue
  const drivingTimeHours = distance <= 100 ? distance / 40 : (100 / 40) + ((distance - 100) / 30);
  
  // Add loading/unloading time based on van size
  const loadingHours = vanSize === 'small' ? 1 : 
                       vanSize === 'medium' ? 1.5 : 
                       vanSize === 'large' ? 2 : 
                       2.5; // luton
  
  // Calculate total hours including loading/unloading time
  const totalHours = drivingTimeHours + loadingHours;
  
  // Round to nearest half hour and ensure minimum of 2 hours
  const estimatedHours = Math.max(2, Math.round(totalHours * 2) / 2);
  const hours = Math.floor(estimatedHours);
  const minutes = (estimatedHours - hours) * 60;
  
  // Format properly with hours and minutes if needed
  const estimatedTime = minutes > 0 ? 
    `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} min` : 
    `${hours} hour${hours !== 1 ? 's' : ''}`;
  
  // Generate explanation
  let explanation = `Based on ${distance} miles distance with a ${vanSize} van`;
  
  if (isWeekend) {
    explanation += ", weekend rates";
  }
  
  if (isPeakHour) {
    explanation += ", peak hour pricing";
  }
  
  if (urgency !== "standard") {
    explanation += `, ${urgency} delivery`;
  }
  
  return {
    price,
    basePrice,
    distance,
    currency: "GBP",
    estimatedTime,
    factors: {
      vanSizeMultiplier,
      timeMultiplier,
      urgencyMultiplier
    },
    explanation
  };
}

// Mock function for distance estimation to maintain compatibility
export const estimateDistance = (
  originAddress: string,
  destinationAddress: string
): Promise<number> => {
  // Use a simple distance estimate based on address length
  // This is just a placeholder until the real distance API is used
  return new Promise((resolve) => {
    setTimeout(() => {
      const distanceRandom = Math.floor(Math.random() * 45) + 5;
      resolve(distanceRandom);
    }, 500);
  });
};