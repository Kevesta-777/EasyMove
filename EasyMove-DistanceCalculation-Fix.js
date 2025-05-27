/**
 * EasyMove Man and Van - Distance Calculation Fix
 *
 * This file contains fixes for the distance calculation API issues
 * to ensure accurate quotes with proper distance and pricing.
 */

// ====================================================
// 1. GOOGLE MAPS API KEY FIX
// ====================================================

/**
 * The Google Maps API is returning REQUEST_DENIED despite having an API key.
 * This typically means:
 * 1. The API key is invalid or expired
 * 2. The API key doesn't have the required permissions (Directions API enabled)
 * 3. Billing is not enabled for the Google Cloud project
 * 4. The key has usage restrictions (domain/IP restrictions)
 *
 * SOLUTION:
 * Replace the existing code in server/services/distance-calculator.ts
 * with this implementation that includes better error handling and validation.
 */

// Add this function to validate the Google Maps API key
async function validateGoogleMapsApiKey() {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    console.log("Google Maps API key is missing");
    return false;
  }

  try {
    // Make a minimal test request to validate the key
    const testUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=London&destination=Birmingham&key=${process.env.GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(testUrl);
    const data = await response.json();

    if (data.status === "OK") {
      console.log("Google Maps API key is valid and working");
      return true;
    } else {
      console.error(`Google Maps API key validation failed: ${data.status}`);

      // Log specific errors based on status for easier troubleshooting
      if (data.status === "REQUEST_DENIED") {
        console.error("API key is likely invalid, disabled, or restricted");
        console.error("Error message from Google:", data.error_message);
      } else if (data.status === "OVER_QUERY_LIMIT") {
        console.error("API key has exceeded its quota");
      }

      return false;
    }
  } catch (error) {
    console.error("Error validating Google Maps API key:", error);
    return false;
  }
}

// Update the calculateDistanceWithGoogleMaps function with better error handling
async function calculateDistanceWithGoogleMaps(
  originAddress,
  destinationAddress,
) {
  try {
    // Validate API key first
    if (!(await validateGoogleMapsApiKey())) {
      throw new Error("Google Maps API key is invalid or restricted");
    }

    console.log(
      `Calculating distance with Google Maps API from ${originAddress} to ${destinationAddress}`,
    );

    // Format addresses for URL by replacing spaces with +
    const encodedOrigin = encodeURIComponent(originAddress);
    const encodedDestination = encodeURIComponent(destinationAddress);

    // Use region parameter for better UK results
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodedOrigin}&destination=${encodedDestination}&mode=driving&region=uk&key=${process.env.GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    // Check if the request was successful
    if (data.status !== "OK") {
      console.error("Google Maps API error:", data.status);
      if (data.error_message) {
        console.error("Error details:", data.error_message);
      }
      throw new Error(`Google Maps API error: ${data.status}`);
    }

    // Get the first route from the response
    const route = data.routes[0];
    if (!route) {
      throw new Error("No routes found");
    }

    // Calculate total distance in meters and convert to miles
    let distanceMeters = 0;
    let durationSeconds = 0;

    for (const leg of route.legs) {
      distanceMeters += leg.distance.value;
      durationSeconds += leg.duration.value;
    }

    // Convert meters to miles (1 meter = 0.000621371 miles)
    const distanceMiles = distanceMeters * 0.000621371;

    // Convert seconds to minutes
    const drivingTimeMinutes = Math.ceil(durationSeconds / 60);

    // Add loading time based on distance
    const baseLoadingMinutes = 30;
    const loadingTimeMinutes =
      distanceMiles < 20
        ? baseLoadingMinutes
        : distanceMiles < 50
          ? baseLoadingMinutes + 15
          : distanceMiles < 100
            ? baseLoadingMinutes + 30
            : baseLoadingMinutes + 45;

    // Add break time for longer journeys
    const breakTimeMinutes =
      distanceMiles > 50 ? Math.floor(drivingTimeMinutes / 120) * 15 : 0;

    // Total estimated time including loading and breaks
    const totalEstimatedTime =
      drivingTimeMinutes + loadingTimeMinutes + breakTimeMinutes;

    // Get route summary
    const simplifiedRoute =
      route.summary || `${originAddress} to ${destinationAddress}`;

    // Round to one decimal place for price accuracy
    const roundedDistance = Math.round(distanceMiles * 10) / 10;

    return {
      distance: roundedDistance,
      unit: "miles",
      estimatedTime: totalEstimatedTime,
      origin: originAddress,
      destination: destinationAddress,
      route: simplifiedRoute,
      usingGoogleMaps: true,
      exactCalculation: true,
    };
  } catch (error) {
    console.error("Error calculating distance with Google Maps:", error);
    throw error;
  }
}

// ====================================================
// 2. FALLBACK DISTANCE CALCULATION ENHANCEMENT
// ====================================================

/**
 * If Google Maps API fails, this improved fallback ensures we still
 * get reasonably accurate distance calculations for pricing.
 */

// Enhancement for the approximate coordinates lookup
const UK_CITY_COORDINATES = {
  london: { latitude: 51.507351, longitude: -0.127758 },
  manchester: { latitude: 53.483959, longitude: -2.244644 },
  birmingham: { latitude: 52.486243, longitude: -1.890401 },
  leeds: { latitude: 53.801277, longitude: -1.548567 },
  glasgow: { latitude: 55.860916, longitude: -4.251433 },
  edinburgh: { latitude: 55.953251, longitude: -3.188267 },
  liverpool: { latitude: 53.400307, longitude: -2.991225 },
  bristol: { latitude: 51.454514, longitude: -2.58791 },
  newcastle: { latitude: 54.978252, longitude: -1.61778 },
  sheffield: { latitude: 53.381129, longitude: -1.470085 },
  belfast: { latitude: 54.597286, longitude: -5.93012 },
  cardiff: { latitude: 51.481583, longitude: -3.17909 },
  nottingham: { latitude: 52.954783, longitude: -1.158109 },
  cambridge: { latitude: 52.205338, longitude: 0.121817 },
  oxford: { latitude: 51.752022, longitude: -1.257677 },
  brighton: { latitude: 50.827778, longitude: -0.152778 },
  portsmouth: { latitude: 50.805832, longitude: -1.087222 },
  leicester: { latitude: 52.636879, longitude: -1.139759 },
  coventry: { latitude: 52.406822, longitude: -1.519693 },
  hull: { latitude: 53.746667, longitude: -0.333333 },
  stoke: { latitude: 53.002668, longitude: -2.179404 },
  plymouth: { latitude: 50.376289, longitude: -4.143841 },
  wolverhampton: { latitude: 52.59137, longitude: -2.110748 },
  derby: { latitude: 52.921963, longitude: -1.475881 },
  swansea: { latitude: 51.621441, longitude: -3.943646 },
  southampton: { latitude: 50.909698, longitude: -1.404351 },
  reading: { latitude: 51.454265, longitude: -0.97813 },
  aberdeen: { latitude: 57.149717, longitude: -2.094278 },
  northampton: { latitude: 52.237211, longitude: -0.896436 },
  luton: { latitude: 51.879762, longitude: -0.417271 },
  york: { latitude: 53.958332, longitude: -1.080278 },
  blackpool: { latitude: 53.817505, longitude: -3.035675 },
  "milton keynes": { latitude: 52.040623, longitude: -0.759417 },
  exeter: { latitude: 50.725556, longitude: -3.526944 },
  sunderland: { latitude: 54.906869, longitude: -1.383801 },
  bath: { latitude: 51.380001, longitude: -2.36 },
  canterbury: { latitude: 51.279999, longitude: 1.08 },
  worcester: { latitude: 52.192001, longitude: -2.22 },
  lincoln: { latitude: 53.23, longitude: -0.54 },
};

// Enhanced haversine distance calculation
function calculateHaversineDistance(point1, point2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 3958.8; // Earth's radius in miles

  const dLat = toRad(point2.latitude - point1.latitude);
  const dLon = toRad(point2.longitude - point1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.latitude)) *
      Math.cos(toRad(point2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Round to one decimal place
  return Math.round(distance * 10) / 10;
}

// Improved location lookup by normalizing city names
function getLocationCoordinates(locationName) {
  // Default central UK location if we can't determine
  const defaultCoords = { latitude: 52.486243, longitude: -1.890401 };

  if (!locationName) return defaultCoords;

  // Normalize input by removing common terms and lowercasing
  const normalized = locationName
    .toLowerCase()
    .replace(/\b(city|town|village|area|district|london borough of)\b/g, "")
    .trim();

  // Direct lookup in our city database
  if (UK_CITY_COORDINATES[normalized]) {
    return UK_CITY_COORDINATES[normalized];
  }

  // Extract the first word (often the city name) and try that
  const firstWord = normalized.split(/[ ,]/)[0];
  if (UK_CITY_COORDINATES[firstWord]) {
    return UK_CITY_COORDINATES[firstWord];
  }

  // Fuzzy matching for close matches
  for (const [cityName, coords] of Object.entries(UK_CITY_COORDINATES)) {
    if (normalized.includes(cityName) || cityName.includes(normalized)) {
      return coords;
    }
  }

  return defaultCoords;
}

// Enhanced fallback calculation function
function fallbackDistanceCalculation(originAddress, destinationAddress) {
  console.log(
    `Using enhanced fallback calculation for ${originAddress} to ${destinationAddress}`,
  );

  // Get coordinates
  const originCoords = getLocationCoordinates(originAddress);
  const destCoords = getLocationCoordinates(destinationAddress);

  // Calculate base distance
  const baseDistance = calculateHaversineDistance(originCoords, destCoords);

  // Apply UK road winding factor (roads are rarely straight)
  const roadWindingFactor =
    baseDistance < 10
      ? 1.6 // City driving
      : baseDistance < 30
        ? 1.5 // Suburban/mixed roads
        : baseDistance < 100
          ? 1.4 // Regional routes
          : 1.3; // Long distance motorways

  // Apply UK-specific adjustment for traffic, roundabouts, etc.
  const ukAdjustmentFactor = 1.1;

  // Calculate final distance with adjustments
  const finalDistance = baseDistance * roadWindingFactor * ukAdjustmentFactor;

  // Calculate travel time
  const avgSpeedMph =
    finalDistance < 10
      ? 18
      : finalDistance < 30
        ? 25
        : finalDistance < 100
          ? 35
          : 45;

  const drivingMinutes = Math.round((finalDistance / avgSpeedMph) * 60);
  const loadingMinutes = 30 + (finalDistance > 30 ? 30 : 0);
  const breakMinutes =
    finalDistance > 50 ? Math.floor(drivingMinutes / 120) * 15 : 0;

  const totalMinutes = drivingMinutes + loadingMinutes + breakMinutes;

  // Round to one decimal place for price accuracy
  const roundedDistance = Math.round(finalDistance * 10) / 10;

  return {
    distance: roundedDistance,
    unit: "miles",
    estimatedTime: totalMinutes,
    origin: originAddress,
    destination: destinationAddress,
    usingGoogleMaps: false,
    exactCalculation: false,
  };
}

// ====================================================
// 3. MAIN DISTANCE CALCULATION FUNCTION
// ====================================================

/**
 * This is the main function that should replace the existing
 * calculateDistance function in server/services/distance-calculator.ts
 */

async function calculateDistance(originAddress, destinationAddress) {
  console.log(
    `Calculating distance from ${originAddress} to ${destinationAddress}`,
  );

  try {
    // First try Google Maps API if available
    if (process.env.GOOGLE_MAPS_API_KEY) {
      try {
        // Validate API key on startup or first use
        const isValid = await validateGoogleMapsApiKey();

        if (isValid) {
          return await calculateDistanceWithGoogleMaps(
            originAddress,
            destinationAddress,
          );
        } else {
          console.warn(
            "Google Maps API key validation failed, using fallback calculation",
          );
        }
      } catch (error) {
        console.error(
          "Google Maps API failed, using enhanced fallback calculation:",
          error,
        );
      }
    }

    // Use enhanced fallback calculation
    return fallbackDistanceCalculation(originAddress, destinationAddress);
  } catch (error) {
    console.error("Error in distance calculation:", error);

    // Ultimate fallback with very conservative estimates
    const fallbackDistance = 50;
    const fallbackTime = 120;

    return {
      distance: fallbackDistance,
      unit: "miles",
      estimatedTime: fallbackTime,
      origin: originAddress,
      destination: destinationAddress,
      usingGoogleMaps: false,
      exactCalculation: false,
    };
  }
}

// ====================================================
// 4. API KEY VALIDATION INSTRUCTIONS
// ====================================================

/**
 * HOW TO FIX YOUR GOOGLE MAPS API KEY:
 *
 * 1. Visit the Google Cloud Console: https://console.cloud.google.com/
 * 2. Select your project or create a new one
 * 3. Navigate to "APIs & Services" > "Dashboard"
 * 4. Click "+ ENABLE APIS AND SERVICES"
 * 5. Search for "Directions API" and enable it
 * 6. Navigate to "APIs & Services" > "Credentials"
 * 7. Create a new API key or edit your existing one
 * 8. Set up API key restrictions (optional but recommended):
 *    - Application restrictions: HTTP referrers (websites)
 *    - API restrictions: Directions API
 * 9. Make sure billing is enabled for your project
 * 10. Update your .env file with the new API key
 *
 * IMPORTANT: The Google Maps API requires a valid billing account,
 * but Google provides a monthly credit that typically covers small
 * to medium usage. Keep an eye on your usage to avoid unexpected charges.
 */

// ====================================================
// 5. INTEGRATION WITH PRICING MODULE
// ====================================================

/**
 * Update the code in server/routes.ts to use this improved distance calculation
 * in the following section to ensure accurate quotes.
 */

// Code to add to server/routes.ts in the calculateQuote endpoint:
async function getQuote(req, res) {
  try {
    const quoteData = req.body;

    // Calculate distance using our improved calculator
    const distanceResponse = await calculateDistance(
      quoteData.pickupAddress,
      quoteData.deliveryAddress,
    );

    // Log the distance for debugging
    console.log(
      `Distance calculated: ${distanceResponse.distance} ${distanceResponse.unit}`,
    );

    // Use the distance to calculate the quote
    const quote = buildPriceBreakdown({
      vanSize: quoteData.vanSize,
      distance: distanceResponse.distance,
      estimatedHours: quoteData.estimatedHours || 2,
      helpers: quoteData.helpers || 0,
      floorAccess: quoteData.floorAccessPickup || "ground",
      liftAvailable: quoteData.liftAvailablePickup || false,
      moveDate: new Date(quoteData.moveDate),
      moveTime: quoteData.moveTime || "09:00",
      urgency: quoteData.urgency || "standard",
      isUrban: distanceResponse.distance < 30, // Assume urban for shorter distances
    });

    // Add distance information to the response
    const response = {
      ...quote,
      distance: distanceResponse.distance,
      estimatedTime: distanceResponse.estimatedTime,
      pickupAddress: quoteData.pickupAddress,
      deliveryAddress: quoteData.deliveryAddress,
      vanSize: quoteData.vanSize,
      moveDate: quoteData.moveDate,
    };

    return res.json(response);
  } catch (error) {
    console.error("Error generating quote:", error);
    return res.status(500).json({ error: "Failed to generate quote" });
  }
}

// ====================================================
// 6. TESTING THE DISTANCE CALCULATION
// ====================================================

/**
 * Add this test function to verify your distance calculation is working
 */

async function testDistanceCalculation() {
  // Define test cases - known distances between UK cities
  const testCases = [
    { origin: "London", destination: "Manchester", expectedApprox: 200 },
    { origin: "Birmingham", destination: "Liverpool", expectedApprox: 100 },
    { origin: "Edinburgh", destination: "Glasgow", expectedApprox: 45 },
    { origin: "Bristol", destination: "Cardiff", expectedApprox: 45 },
    { origin: "Portsmouth", destination: "Newcastle", expectedApprox: 400 },
  ];

  console.log("TESTING DISTANCE CALCULATION");
  console.log("============================");

  let failures = 0;

  for (const test of testCases) {
    try {
      const result = await calculateDistance(test.origin, test.destination);

      const isReasonable =
        Math.abs(result.distance - test.expectedApprox) <=
        test.expectedApprox * 0.2;
      const status = isReasonable ? "PASS" : "FAIL";

      console.log(
        `${test.origin} to ${test.destination}: ${result.distance} miles (expected ~${test.expectedApprox}) - ${status}`,
      );

      if (!isReasonable) failures++;
    } catch (error) {
      console.error(`ERROR for ${test.origin} to ${test.destination}:`, error);
      failures++;
    }
  }

  if (failures === 0) {
    console.log("\nAll distance calculations passed!");
  } else {
    console.log(`\n${failures} distance calculation tests failed.`);
  }
}

// ====================================================
// 7. EXPORT FUNCTIONS FOR USE IN APPLICATION
// ====================================================

module.exports = {
  calculateDistance,
  validateGoogleMapsApiKey,
  testDistanceCalculation,
};
