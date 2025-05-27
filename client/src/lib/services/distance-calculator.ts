import { apiRequest } from "../queryClient";

export interface DistanceResponse {
  distance: number;
  unit: string;
  estimatedTime: number; // in minutes
  origin?: string;
  destination?: string;
  route?: string;
  usingGoogleMaps?: boolean;
  exactCalculation?: boolean;
  calculationMethod?: string;
}

/**
 * Calculate distance between two addresses using the server API
 * This uses Google Maps API when available for high accuracy
 * Falls back to approximation otherwise
 */
export async function calculateDistance(
  fromAddress: string,
  toAddress: string,
): Promise<DistanceResponse> {
  try {
    console.log("111111111111111111111111");
    // Use our dedicated distance calculation endpoint
    const data = await apiRequest<DistanceResponse>({
      method: "POST",
      // url: '/api/quotes/distance',
      url: "/api/calculate-distance",
      data: { from: fromAddress, to: toAddress },
    });
    console.log("2222222222222222222222222222222222222222222222");
    return data;
  } catch (error: any) {
    console.error("Error calculating distance:", error);
    // Return a fallback with zero distance in case of errors
    return {
      distance: 0,
      unit: "miles",
      estimatedTime: 0,
      origin: fromAddress,
      destination: toAddress,
      usingGoogleMaps: false,
      exactCalculation: false,
      calculationMethod: "error_fallback",
    };
  }
}

/**
 * Format the estimated time into a readable format
 */
export function formatEstimatedTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  }

  return `${hours} hour${hours > 1 ? "s" : ""} ${remainingMinutes} min`;
}

/**
 * Format distance with appropriate unit
 */
export function formatDistance(
  distance: number | undefined | null,
  unit: string = "miles",
): string {
  // Handle undefined or null values
  if (distance === undefined || distance === null) {
    return `0 ${unit}`;
  }

  // Keep one decimal place for shorter distances, none for longer ones
  const formattedDistance =
    distance < 10 ? distance.toFixed(1) : Math.round(distance);
  return `${formattedDistance} ${unit}`;
}
