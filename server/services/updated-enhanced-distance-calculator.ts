/**
 * Enhanced Distance Calculator
 *
 * Uses Google Maps API for accurate distance calculations with fallback to the fixed
 * distance calculator when Google Maps API is unavailable or fails.
 */
import { calculateDistance as calculateFixedDistance } from "./fixed-distance-calculator";
import {
  calculateGoogleMapsDistance,
  validateGoogleMapsApiKey,
} from "./google-maps-service";

// Track if Google Maps API is available
let googleMapsApiAvailable: boolean | null = null;

/**
 * Enhanced distance calculation using Google Maps API with fallback
 */
export async function updatedCalculateDistance(
  from: string,
  to: string,
): Promise<{
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
    console.log(
      `Google Maps API ${googleMapsApiAvailable ? "is" : "is not"} available`,
    );
  }

  // Try to use Google Maps API if available
  if (googleMapsApiAvailable) {
    try {
      console.log("Using Google Maps API for distance calculation");
      const result = await calculateGoogleMapsDistance(from, to);

      // Check if the calculation was successful
      if (result.status === "OK") {
        // Return the Google Maps result
        return {
          distance: result.distance,
          unit: result.unit,
          estimatedTime: result.durationMinutes,
          exactCalculation: true,
          source: "google_maps",
          originAddress: result.originAddress,
          destinationAddress: result.destinationAddress,
        };
      } else {
        console.warn(
          "Google Maps API returned an error, falling back to fixed calculator:",
          result.status,
        );
      }
    } catch (error) {
      console.error(
        "Error using Google Maps API, falling back to fixed calculator:",
        error,
      );
    }
  }

  // Fall back to the fixed distance calculator
  console.log("Using fixed distance calculator as fallback");
  const fixedResult = await calculateFixedDistance(from, to);

  return {
    ...fixedResult,
    source: "fixed_calculator",
  };
}
