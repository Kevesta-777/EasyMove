/**
 * EasyMove Google Maps Distance Calculator
 * 
 * Provides accurate distance and travel time calculations using Google Maps API
 * with fallback to the fixed calculator when API is not available.
 */
import axios from 'axios';
import { calculateDistance as calculateFixedDistance } from './fixed-distance-calculator';

// Get Google Maps API key from environment
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

/**
 * Check if Google Maps API key is configured
 */
export function isGoogleMapsAvailable(): boolean {
  return Boolean(GOOGLE_MAPS_API_KEY);
}

/**
 * Calculate distance and travel time between two addresses using Google Maps API
 */
export async function calculateGoogleMapsDistance(origin: string, destination: string): Promise<{
  distance: number;
  duration: number;
  source: string;
  status: string;
  originAddress?: string;
  destinationAddress?: string;
  error?: string;
}> {
  try {
    // Validate input
    if (!origin || !destination) {
      throw new Error('Origin and destination addresses are required');
    }

    // Check if Google Maps API key is available
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key not configured');
    }

    // Encode addresses for URL
    const encodedOrigin = encodeURIComponent(origin);
    const encodedDestination = encodeURIComponent(destination);

    // Log API request (without exposing the key)
    console.log(`Making Google Maps API request for "${origin}" to "${destination}"`);

    // Make request to Google Maps Distance Matrix API
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodedOrigin}&destinations=${encodedDestination}&units=imperial&key=${GOOGLE_MAPS_API_KEY}`
    );

    // Check if the response is valid
    if (response.data.status !== 'OK') {
      throw new Error(`Google Maps API error: ${response.data.status}`);
    }

    // Get the first result
    const result = response.data.rows[0]?.elements[0];
    
    if (!result || result.status !== 'OK') {
      throw new Error(`No route found: ${result?.status || 'UNKNOWN_ERROR'}`);
    }

    // Extract distance in miles (converting from meters)
    const distanceInMiles = result.distance.value / 1609.34;
    
    // Extract duration in minutes (converting from seconds)
    const durationMinutes = Math.ceil(result.duration.value / 60);

    // Get formatted addresses from response
    const originAddress = response.data.origin_addresses[0];
    const destinationAddress = response.data.destination_addresses[0];

    // Log successful distance calculation
    console.log(`Google Maps distance calculation: ${distanceInMiles.toFixed(1)} miles, ${durationMinutes} minutes`);

    // Return the calculated distance, duration, and addresses
    return {
      distance: parseFloat(distanceInMiles.toFixed(1)),
      duration: durationMinutes,
      source: 'google_maps',
      status: 'OK',
      originAddress,
      destinationAddress
    };
  } catch (error) {
    // Log the error
    console.error('Google Maps distance calculation error:', error);
    
    // Return error with default values
    return {
      distance: 0,
      duration: 0,
      source: 'google_maps_error',
      status: 'ERROR',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Enhanced distance calculation with Google Maps and fallback
 */
export async function calculateDistance(
  from: string,
  to: string
): Promise<{
  distance: number;
  unit: string;
  estimatedTime: number;
  exactCalculation: boolean;
  source: string;
  originAddress?: string;
  destinationAddress?: string;
}> {
  // First try Google Maps if API key is available
  if (isGoogleMapsAvailable()) {
    try {
      const googleResult = await calculateGoogleMapsDistance(from, to);
      
      if (googleResult.status === 'OK') {
        return {
          distance: googleResult.distance,
          unit: 'miles',
          estimatedTime: googleResult.duration,
          exactCalculation: true,
          source: 'google_maps',
          originAddress: googleResult.originAddress,
          destinationAddress: googleResult.destinationAddress
        };
      }
      
      console.warn(`Google Maps API failed with status: ${googleResult.status}. Falling back to fixed calculator.`);
    } catch (error) {
      console.error('Error using Google Maps API:', error);
    }
  }
  
  // Fall back to fixed calculator
  console.log('Using fixed distance calculator as fallback');
  const fixedResult = await calculateFixedDistance(from, to);
  
  return {
    ...fixedResult,
    source: 'fixed_calculator'
  };
}