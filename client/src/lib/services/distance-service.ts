/**
 * Distance Service - Google Distance Matrix API Integration
 */

export interface DistanceResult {
  distance: number;
  duration: number;
  status: 'OK' | 'ERROR';
  source: 'google_maps' | 'fallback';
}

/**
 * Calculate real distance using Google Distance Matrix API
 */
export async function calculateRealDistance(
  origin: string,
  destination: string
): Promise<DistanceResult> {
  try {
    const response = await fetch('/api/distance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        origin,
        destination,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.distance && data.distance.exactCalculation) {
      return {
        distance: data.distance.distance,
        duration: data.distance.estimatedTime,
        status: 'OK',
        source: 'google_maps',
      };
    } else {
      throw new Error('Invalid distance calculation response');
    }
  } catch (error) {
    console.error('Distance calculation error:', error);
    
    // Fallback: Basic estimation based on typical UK distances
    const fallbackDistance = estimateFallbackDistance(origin, destination);
    
    return {
      distance: fallbackDistance,
      duration: Math.round((fallbackDistance / 45) * 60), // 45mph average
      status: 'ERROR',
      source: 'fallback',
    };
  }
}

/**
 * Fallback distance estimation for common UK routes
 */
function estimateFallbackDistance(origin: string, destination: string): number {
  const routes: Record<string, number> = {
    'london-manchester': 200,
    'london-birmingham': 120,
    'london-leeds': 195,
    'london-liverpool': 220,
    'london-newcastle': 290,
    'london-glasgow': 420,
    'london-edinburgh': 400,
    'manchester-birmingham': 90,
    'manchester-leeds': 45,
    'birmingham-leeds': 110,
  };

  const normalizeLocation = (location: string) => {
    return location.toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(' ')[0] // Take first word
      .trim();
  };

  const normalizedOrigin = normalizeLocation(origin);
  const normalizedDestination = normalizeLocation(destination);
  
  const routeKey1 = `${normalizedOrigin}-${normalizedDestination}`;
  const routeKey2 = `${normalizedDestination}-${normalizedOrigin}`;
  
  return routes[routeKey1] || routes[routeKey2] || 50; // Default 50 miles
}