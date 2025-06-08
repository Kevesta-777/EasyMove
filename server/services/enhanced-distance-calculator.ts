/**
 * Enhanced Distance Calculator
 * 
 * Uses Google Maps API for accurate distance calculations with fallback to the fixed
 * distance calculator when Google Maps API is unavailable or fails.
 */
import { calculateDistance as calculateFixedDistance } from './fixed-distance-calculator';
import { calculateGoogleMapsDistance, validateGoogleMapsApiKey } from './google-maps-service';

// Track if Google Maps API is available
let googleMapsApiAvailable: boolean | null = null;

/**
 * Enhanced distance calculation using Google Maps API with fallback
 */
export async function calculateDistance(from: string, to: string): Promise<{
  distance: number;
  unit: string;
  estimatedTime: number;
  exactCalculation: boolean;
  source?: string;
  originAddress?: string;
  destinationAddress?: string;
}> {
  // Check if we've already validated the Google Maps API
  if (googleMapsApiAvailable === null) {
    // Validate the API key on first use
    googleMapsApiAvailable = await validateGoogleMapsApiKey();
    console.log(`Google Maps API ${googleMapsApiAvailable ? 'is' : 'is not'} available`);
  }

  // Try to use Google Maps API if available
  if (googleMapsApiAvailable) {
    try {
      console.log('Using Google Maps API for distance calculation');
      const result = await calculateGoogleMapsDistance(from, to);
      
      // Check if the calculation was successful
      if (result.status === 'OK') {
        // Return the Google Maps result
        return {
          distance: result.distance,
          unit: result.unit,
          estimatedTime: result.durationMinutes,
          exactCalculation: true,
          source: 'google_maps',
          originAddress: result.originAddress,
          destinationAddress: result.destinationAddress
        };
      } else {
        console.warn('Google Maps API returned an error, falling back to fixed calculator:', result.status);
      }
    } catch (error) {
      console.error('Error using Google Maps API, falling back to fixed calculator:', error);
    }
  }

  // Fall back to the fixed distance calculator
  console.log('Using fixed distance calculator as fallback');
  const fixedResult = await calculateFixedDistance(from, to);
  
  return {
    ...fixedResult,
    source: 'fixed_calculator'
  };
}

/**
 * Calculate driving time with additional factors for loading/unloading
 */
export function calculateTotalTravelTime(drivingTimeMinutes: number, vanSize: string): number {
  // Base loading and unloading time (30 minutes)
  let loadingTime = 30;
  
  // Add extra time for larger vans
  if (vanSize === 'medium') {
    loadingTime += 15;
  } else if (vanSize === 'large') {
    loadingTime += 30;
  } else if (vanSize === 'luton') {
    loadingTime += 45;
  }
  
  // Add break times for longer journeys (15-minute break for every 2 hours of driving)
  const breakTime = Math.floor(drivingTimeMinutes / 120) * 15;
  
  // Calculate the total time
  return drivingTimeMinutes + loadingTime + breakTime;
}

/**
 * Format travel time in hours and minutes
 */
export function formatTravelTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 0) {
    return `${remainingMinutes} minutes`;
  } else if (remainingMinutes === 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else {
    return `${hours} hour${hours > 1 ? 's' : ''} and ${remainingMinutes} minutes`;
  }
}