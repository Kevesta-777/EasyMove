import { OpenAI } from "openai";
import axios from "axios";

interface GeoPoint {
  latitude: number;
  longitude: number;
}

interface DistanceResponse {
  distance: number;
  unit: string;
  estimatedTime: number; // in minutes
  origin?: string;
  destination?: string;
  route?: string;
  usingGoogleMaps?: boolean; // Whether Google Maps API was used for calculation
  exactCalculation?: boolean; // Whether exact calculation methods were used
}

/**
 * Calculate the distance between two addresses
 * Uses known coordinates for major UK cities, with AI estimation as a backup when available
 */
/**
 * Calculate distance and route using Google Maps Directions API
 */
async function calculateDistanceWithGoogleMaps(
  originAddress: string,
  destinationAddress: string,
): Promise<DistanceResponse> {
  try {
    // Check if Google Maps API key is available
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      throw new Error("Google Maps API key is not set");
    }

    console.log(
      `Calculating distance with Google Maps API from ${originAddress} to ${destinationAddress}`,
    );

    // Format addresses for URL by replacing spaces with +
    const encodedOrigin = encodeURIComponent(originAddress);
    const encodedDestination = encodeURIComponent(destinationAddress);

    // Build URL for Google Maps Directions API - ensure region=uk to optimize for UK roads
    // Use 'driving' mode and 'best_guess' for traffic estimation for most accurate results
    // Add 'alternatives=false' to get only the best route (typically lowest cost)
    // Add 'departure_time=now' for the current time (required for traffic_model to work)
    const now = Math.floor(Date.now() / 1000); // Current time in Unix format (seconds)
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodedOrigin}&destination=${encodedDestination}&mode=driving&region=uk&departure_time=${now}&traffic_model=best_guess&alternatives=false&key=${process.env.GOOGLE_MAPS_API_KEY}`;
    console.log(
      "77777777777777777777777777777777",
      process.env.GOOGLE_MAPS_API_KEY,
    );
    console.log(
      `Calling Google Maps API for route: ${originAddress} to ${destinationAddress}`,
    );

    const response = await axios.get(url);
    const data = response.data;
    console.log("0000000000000000000", data);
    // Check if the request was successful
    if (data.status !== "OK") {
      console.error("Google Maps API error:", data.status);
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

    // Add loading time based on distance (longer distances typically mean more items)
    const baseLoadingMinutes = 30;
    const loadingTimeMinutes =
      distanceMiles < 20
        ? baseLoadingMinutes
        : distanceMiles < 50
          ? baseLoadingMinutes + 15
          : distanceMiles < 100
            ? baseLoadingMinutes + 30
            : baseLoadingMinutes + 45;

    // Add break time for commercial drivers on longer journeys
    const breakTimeMinutes =
      distanceMiles > 50 ? Math.floor(drivingTimeMinutes / 120) * 15 : 0;

    // Total estimated time including loading and breaks
    const totalEstimatedTime =
      drivingTimeMinutes + loadingTimeMinutes + breakTimeMinutes;

    // Get a simplified version of the route for display
    const simplifiedRoute =
      route.summary || `${originAddress} to ${destinationAddress}`;

    // Keep one decimal place for more precise distance calculation
    // This is important for accurate pricing, especially for shorter journeys
    const roundedDistance = Math.round(distanceMiles * 10) / 10;
    console.log("99999999999999999", roundedDistance);
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

export async function calculateDistance(
  originAddress: string,
  destinationAddress: string,
): Promise<DistanceResponse> {
  console.log(
    `Calculating distance from ${originAddress} to ${destinationAddress}`,
  );

  try {
    // First try Google Maps API if available
    if (process.env.GOOGLE_MAPS_API_KEY) {
      try {
        return await calculateDistanceWithGoogleMaps(
          originAddress,
          destinationAddress,
        );
      } catch (error) {
        console.error(
          "Google Maps API failed, falling back to approximate calculation:",
          error,
        );
        // Continue with the fallback calculation
      }
    }

    // Fallback to our location database of major cities
    const originCoords = await approximateCoordinates(originAddress);
    const destCoords = await approximateCoordinates(destinationAddress);

    // Calculate road distance with a winding factor to account for real-world roads
    // Roads are rarely straight line, especially in UK
    const distanceInMiles = calculateHaversineDistance(
      originCoords,
      destCoords,
    );

    // Use higher winding factors to better reflect actual driving distances
    // UK roads are particularly winding compared to straight-line measurements
    const roadWindingFactor =
      distanceInMiles < 10
        ? 1.6 // City driving is very winding (60% more)
        : distanceInMiles < 30
          ? 1.5 // Suburban/mixed roads (50% more)
          : distanceInMiles < 100
            ? 1.4 // Regional routes (40% more)
            : 1.3; // Long distance, still with significant winding (30% more)

    // Apply winding factor to get more realistic road distance
    const adjustedDistance = distanceInMiles * roadWindingFactor;

    // Add additional adjustment for UK-specific conditions: traffic, roundabouts, roadworks
    // This helps ensure we're never underestimating the journey for drivers
    const ukAdjustmentFactor = 1.1; // Additional 10% for UK-specific road conditions
    const finalAdjustedDistance = adjustedDistance * ukAdjustmentFactor;

    // Calculate speed based on distance (shorter distances = slower average speed)
    // Use more conservative speed estimates that account for traffic and stops
    // Urban: 18mph, Suburban: 25mph, Regional: 35mph, Highway: 45mph
    const avgSpeedMph =
      finalAdjustedDistance < 10
        ? 18
        : finalAdjustedDistance < 30
          ? 25
          : finalAdjustedDistance < 100
            ? 35
            : 45;

    // Calculate base drive time (in minutes)
    const baseDriveMinutes = Math.round(
      (finalAdjustedDistance / avgSpeedMph) * 60,
    );

    // Add time for breaks on longer journeys (required by law for commercial drivers)
    // For every 2 hours of driving, add 15 minutes break time
    const breakTimeMinutes =
      finalAdjustedDistance > 50 ? Math.floor(baseDriveMinutes / 120) * 15 : 0;

    // Add loading time based on distance (longer distances typically mean more items)
    const baseLoadingMinutes = 30;
    const loadingTimeMinutes =
      finalAdjustedDistance < 20
        ? baseLoadingMinutes
        : finalAdjustedDistance < 50
          ? baseLoadingMinutes + 15
          : finalAdjustedDistance < 100
            ? baseLoadingMinutes + 30
            : baseLoadingMinutes + 45;

    // Calculate total estimated time including all factors
    const totalEstimatedTime =
      baseDriveMinutes + breakTimeMinutes + loadingTimeMinutes;

    // If OpenAI API key is available, try that in the background for future accuracy improvements
    if (process.env.OPENAI_API_KEY) {
      // Don't await this - we don't want to delay the response
      estimateDistanceWithAI(originAddress, destinationAddress)
        .then((aiResponse) => {
          console.log(
            `AI distance estimate: ${aiResponse.distance} miles, ${aiResponse.estimatedTime} minutes`,
          );
        })
        .catch((error) => {
          console.log(
            "AI distance estimation failed, using calculated distance only",
          );
        });
    }

    // Round to one decimal place for more precision
    const roundedDistance = Math.round(finalAdjustedDistance * 10) / 10;

    return {
      distance: roundedDistance,
      unit: "miles",
      estimatedTime: totalEstimatedTime,
      origin: originAddress,
      destination: destinationAddress,
      usingGoogleMaps: false,
      exactCalculation: false,
    };
  } catch (error) {
    console.error("Error in distance calculation:", error);

    // Ultimate fallback with very conservative estimates
    // For a fail-safe response that won't crash the application
    const fallbackDistance = 20; // Assume 20 miles if everything fails
    const fallbackTime = 90; // Assume 90 minutes total time

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

/**
 * Uses AI to estimate distance between two locations
 */
async function estimateDistanceWithAI(
  originAddress: string,
  destinationAddress: string,
): Promise<DistanceResponse> {
  const aiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await aiClient.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a distance calculation assistant. Provide accurate distance estimates between two UK locations.",
      },
      {
        role: "user",
        content: `Calculate the driving distance between these two locations in the UK:
        Origin: ${originAddress}
        Destination: ${destinationAddress}
        
        Provide:
        1. The distance in miles
        2. The estimated driving time in minutes
        
        Respond with JSON in this format:
        {
          "distance": number,
          "unit": "miles",
          "estimatedTime": number
        }
        
        Be as accurate as possible based on your knowledge of UK geography.`,
      },
    ],
  });

  try {
    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      distance: result.distance || 0,
      unit: result.unit || "miles",
      estimatedTime: result.estimatedTime || 0,
      origin: originAddress,
      destination: destinationAddress,
      usingGoogleMaps: false,
      exactCalculation: true, // AI can provide fairly accurate estimate
    };
  } catch (error) {
    console.error("Error parsing AI distance response:", error);
    throw new Error("Failed to parse distance calculation");
  }
}

/**
 * Get approximate coordinates for major UK cities and areas
 */
async function approximateCoordinates(address: string): Promise<GeoPoint> {
  // Default to central UK location if no match
  let coords = { latitude: 52.486243, longitude: -1.890401 };

  // Try to extract postcode and use it for more accurate location
  const ukPostcodeRegex = /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/i;
  const ukPartialPostcodeRegex = /\b[A-Z]{1,2}\d[A-Z\d]?\b/i;

  const fullPostcodeMatch = address.match(ukPostcodeRegex);
  const partialPostcodeMatch = address.match(ukPartialPostcodeRegex);

  // Handle full postcode matches first
  if (fullPostcodeMatch) {
    const postcode = fullPostcodeMatch[0].toUpperCase().replace(/\s/g, "");
    const firstPart = postcode.substring(0, 2);

    // Map common postcode areas to locations
    if (
      firstPart.startsWith("E") ||
      firstPart.startsWith("EC") ||
      firstPart.startsWith("W") ||
      firstPart.startsWith("WC") ||
      firstPart.startsWith("N") ||
      firstPart.startsWith("NW") ||
      firstPart.startsWith("SE") ||
      firstPart.startsWith("SW")
    ) {
      return { latitude: 51.507351, longitude: -0.127758 }; // London
    }
  }

  // Handle partial postcode matches
  if (partialPostcodeMatch) {
    const partialCode = partialPostcodeMatch[0].toUpperCase();

    // London
    if (
      ["E", "EC", "W", "WC", "N", "NW", "SE", "SW"].includes(
        partialCode.substring(0, 1),
      ) ||
      [
        "E1",
        "E2",
        "E3",
        "E4",
        "E5",
        "E6",
        "E7",
        "E8",
        "E9",
        "E10",
        "E11",
        "E12",
        "E13",
        "E14",
        "E15",
        "E16",
        "E17",
        "E18",
        "E20",
        "EC1",
        "EC2",
        "EC3",
        "EC4",
        "W1",
        "W2",
        "W3",
        "W4",
        "W5",
        "W6",
        "W7",
        "W8",
        "W9",
        "W10",
        "W11",
        "W12",
        "W13",
        "W14",
        "WC1",
        "WC2",
        "N1",
        "N2",
        "N3",
        "N4",
        "N5",
        "N6",
        "N7",
        "N8",
        "N9",
        "N10",
        "N11",
        "N12",
        "N13",
        "N14",
        "N15",
        "N16",
        "N17",
        "N18",
        "N19",
        "N20",
        "N21",
        "N22",
        "NW1",
        "NW2",
        "NW3",
        "NW4",
        "NW5",
        "NW6",
        "NW7",
        "NW8",
        "NW9",
        "NW10",
        "NW11",
        "SE1",
        "SE2",
        "SE3",
        "SE4",
        "SE5",
        "SE6",
        "SE7",
        "SE8",
        "SE9",
        "SE10",
        "SE11",
        "SE12",
        "SE13",
        "SE14",
        "SE15",
        "SE16",
        "SE17",
        "SE18",
        "SE19",
        "SE20",
        "SE21",
        "SE22",
        "SE23",
        "SE24",
        "SE25",
        "SE26",
        "SE27",
        "SE28",
        "SW1",
        "SW2",
        "SW3",
        "SW4",
        "SW5",
        "SW6",
        "SW7",
        "SW8",
        "SW9",
        "SW10",
        "SW11",
        "SW12",
        "SW13",
        "SW14",
        "SW15",
        "SW16",
        "SW17",
        "SW18",
        "SW19",
        "SW20",
      ].includes(partialCode)
    ) {
      return { latitude: 51.507351, longitude: -0.127758 }; // London
    }

    // Birmingham
    if (
      partialCode.startsWith("B") ||
      [
        "B1",
        "B2",
        "B3",
        "B4",
        "B5",
        "B6",
        "B7",
        "B8",
        "B9",
        "B10",
        "B11",
        "B12",
        "B13",
        "B14",
        "B15",
        "B16",
        "B17",
        "B18",
        "B19",
        "B20",
        "B21",
        "B23",
        "B24",
        "B25",
        "B26",
        "B27",
        "B28",
        "B29",
        "B30",
        "B31",
        "B32",
        "B33",
        "B34",
        "B35",
        "B36",
        "B37",
        "B38",
        "B40",
        "B42",
        "B43",
        "B44",
        "B45",
        "B46",
        "B47",
        "B48",
        "B49",
        "B50",
        "B60",
        "B61",
        "B62",
        "B63",
        "B64",
        "B65",
        "B66",
        "B67",
        "B68",
        "B69",
        "B70",
        "B71",
        "B72",
        "B73",
        "B74",
        "B75",
        "B76",
        "B77",
        "B78",
        "B79",
        "B80",
      ].includes(partialCode)
    ) {
      return { latitude: 52.486243, longitude: -1.890401 }; // Birmingham
    }

    // Manchester
    if (
      partialCode.startsWith("M") ||
      [
        "M1",
        "M2",
        "M3",
        "M4",
        "M5",
        "M6",
        "M7",
        "M8",
        "M9",
        "M11",
        "M12",
        "M13",
        "M14",
        "M15",
        "M16",
        "M17",
        "M18",
        "M19",
        "M20",
        "M21",
        "M22",
        "M23",
        "M24",
        "M25",
        "M26",
        "M27",
        "M28",
        "M29",
        "M30",
        "M31",
        "M32",
        "M33",
        "M34",
        "M35",
        "M38",
        "M40",
        "M41",
        "M43",
        "M44",
        "M45",
        "M46",
        "M50",
        "M60",
        "M61",
        "M90",
      ].includes(partialCode)
    ) {
      return { latitude: 53.483959, longitude: -2.244644 }; // Manchester
    }

    // Leeds
    if (
      partialCode.startsWith("LS") ||
      [
        "LS1",
        "LS2",
        "LS3",
        "LS4",
        "LS5",
        "LS6",
        "LS7",
        "LS8",
        "LS9",
        "LS10",
        "LS11",
        "LS12",
        "LS13",
        "LS14",
        "LS15",
        "LS16",
        "LS17",
        "LS18",
        "LS19",
        "LS20",
        "LS21",
        "LS22",
        "LS23",
        "LS24",
        "LS25",
        "LS26",
        "LS27",
        "LS28",
        "LS29",
      ].includes(partialCode)
    ) {
      return { latitude: 53.801277, longitude: -1.548567 }; // Leeds
    }

    // Glasgow
    if (
      partialCode.startsWith("G") ||
      [
        "G1",
        "G2",
        "G3",
        "G4",
        "G5",
        "G11",
        "G12",
        "G13",
        "G14",
        "G15",
        "G20",
        "G21",
        "G22",
        "G23",
        "G31",
        "G32",
        "G33",
        "G34",
        "G40",
        "G41",
        "G42",
        "G43",
        "G44",
        "G45",
        "G46",
        "G51",
        "G52",
        "G53",
        "G60",
        "G61",
        "G62",
        "G63",
        "G64",
        "G65",
        "G66",
        "G67",
        "G68",
        "G69",
        "G70",
        "G71",
        "G72",
        "G73",
        "G74",
        "G75",
        "G76",
        "G77",
        "G78",
        "G79",
        "G81",
        "G82",
        "G83",
        "G84",
        "G90",
      ].includes(partialCode)
    ) {
      return { latitude: 55.860916, longitude: -4.251433 }; // Glasgow
    }
  }

  // Comprehensive map of UK cities and areas
  const cityCoordinates: Record<string, GeoPoint> = {
    // Major cities
    london: { latitude: 51.507351, longitude: -0.127758 },
    manchester: { latitude: 53.483959, longitude: -2.244644 },
    birmingham: { latitude: 52.486243, longitude: -1.890401 },
    leeds: { latitude: 53.801277, longitude: -1.548567 },
    glasgow: { latitude: 55.860916, longitude: -4.251433 },
    edinburgh: { latitude: 55.953251, longitude: -3.188267 },
    liverpool: { latitude: 53.408371, longitude: -2.991573 },
    bristol: { latitude: 51.454514, longitude: -2.58791 },
    sheffield: { latitude: 53.381129, longitude: -1.470085 },
    cardiff: { latitude: 51.481583, longitude: -3.17909 },
    belfast: { latitude: 54.597285, longitude: -5.93012 },
    newcastle: { latitude: 54.978252, longitude: -1.61778 },
    "newcastle upon tyne": { latitude: 54.978252, longitude: -1.61778 },

    // Northeast England
    sunderland: { latitude: 54.906869, longitude: -1.383801 },
    durham: { latitude: 54.777065, longitude: -1.57855 },
    gateshead: { latitude: 54.95297, longitude: -1.603624 },
    middlesbrough: { latitude: 54.574227, longitude: -1.235298 },
    northumberland: { latitude: 55.415296, longitude: -1.881475 },
    "south shields": { latitude: 54.997851, longitude: -1.432034 },
    "north shields": { latitude: 55.016196, longitude: -1.44937 },
    darlington: { latitude: 54.52721, longitude: -1.561421 },
    stockton: { latitude: 54.563972, longitude: -1.317714 },
    hartlepool: { latitude: 54.69245, longitude: -1.212941 },

    // Southeast England
    brighton: { latitude: 50.82253, longitude: -0.137163 },
    portsmouth: { latitude: 50.816667, longitude: -1.083333 },
    southampton: { latitude: 50.909698, longitude: -1.404351 },
    oxford: { latitude: 51.752022, longitude: -1.257677 },
    cambridge: { latitude: 52.205337, longitude: 0.121817 },
    reading: { latitude: 51.458733, longitude: -0.972957 },
    "milton keynes": { latitude: 52.040623, longitude: -0.759417 },
    canterbury: { latitude: 51.275832, longitude: 1.087978 },
    eastbourne: { latitude: 50.768036, longitude: 0.290472 },
    hastings: { latitude: 50.853982, longitude: 0.59125 },

    // Southwest England
    plymouth: { latitude: 50.375456, longitude: -4.142656 },
    exeter: { latitude: 50.725554, longitude: -3.526762 },
    bournemouth: { latitude: 50.720806, longitude: -1.880734 },
    bath: { latitude: 51.380001, longitude: -2.360002 },
    cheltenham: { latitude: 51.899982, longitude: -2.080008 },
    gloucester: { latitude: 51.864445, longitude: -2.244444 },
    swindon: { latitude: 51.558376, longitude: -1.781049 },
    taunton: { latitude: 51.015339, longitude: -3.106495 },
    torquay: { latitude: 50.461559, longitude: -3.5253 },

    // Midlands
    nottingham: { latitude: 52.954784, longitude: -1.158109 },
    leicester: { latitude: 52.636878, longitude: -1.139759 },
    coventry: { latitude: 52.408054, longitude: -1.510556 },
    stoke: { latitude: 53.002666, longitude: -2.179404 },
    "stoke-on-trent": { latitude: 53.002666, longitude: -2.179404 },
    wolverhampton: { latitude: 52.58497, longitude: -2.12882 },
    derby: { latitude: 52.921619, longitude: -1.47646 },
    worcester: { latitude: 52.189722, longitude: -2.220278 },
    telford: { latitude: 52.678418, longitude: -2.445258 },

    // Northwest England
    blackpool: { latitude: 53.817501, longitude: -3.035645 },
    preston: { latitude: 53.7632, longitude: -2.70345 },
    blackburn: { latitude: 53.74831, longitude: -2.482118 },
    bolton: { latitude: 53.578003, longitude: -2.429251 },
    wigan: { latitude: 53.543959, longitude: -2.637362 },
    chester: { latitude: 53.193392, longitude: -2.893075 },
    warrington: { latitude: 53.388269, longitude: -2.596998 },
    carlisle: { latitude: 54.892473, longitude: -2.932931 },

    // Yorkshire & Humber
    york: { latitude: 53.961304, longitude: -1.07996 },
    bradford: { latitude: 53.795984, longitude: -1.759398 },
    huddersfield: { latitude: 53.645792, longitude: -1.785035 },
    hull: { latitude: 53.745671, longitude: -0.336741 },
    doncaster: { latitude: 53.52282, longitude: -1.128462 },
    barnsley: { latitude: 53.55206, longitude: -1.479726 },
    wakefield: { latitude: 53.683298, longitude: -1.505924 },
    rotherham: { latitude: 53.43256, longitude: -1.357355 },

    // Scotland
    aberdeen: { latitude: 57.149651, longitude: -2.099075 },
    dundee: { latitude: 56.462002, longitude: -2.9707 },
    stirling: { latitude: 56.116943, longitude: -3.936765 },
    inverness: { latitude: 57.477772, longitude: -4.224721 },
    perth: { latitude: 56.395817, longitude: -3.437195 },
    falkirk: { latitude: 55.999722, longitude: -3.783333 },
    kilmarnock: { latitude: 55.611099, longitude: -4.495277 },
    dumfries: { latitude: 55.070833, longitude: -3.605556 },

    // Wales
    swansea: { latitude: 51.621441, longitude: -3.943646 },
    newport: { latitude: 51.58849, longitude: -2.99766 },
    wrexham: { latitude: 53.04604, longitude: -2.992494 },
    bangor: { latitude: 53.228006, longitude: -4.128511 },
    aberystwyth: { latitude: 52.415303, longitude: -4.082857 },
    bridgend: { latitude: 51.505363, longitude: -3.576975 },
    llandudno: { latitude: 53.322847, longitude: -3.82726 },

    // Northern Ireland
    derry: { latitude: 54.99673, longitude: -7.30929 },
    lisburn: { latitude: 54.516, longitude: -6.058 },
    newry: { latitude: 54.1758, longitude: -6.3399 },
    "bangor-ni": { latitude: 54.6538, longitude: -5.6682 },
    coleraine: { latitude: 55.1333, longitude: -6.6667 },
  };

  // Try to match with a known city
  const addressLower = address.toLowerCase();
  for (const [city, coordinates] of Object.entries(cityCoordinates)) {
    if (addressLower.includes(city)) {
      coords = coordinates;
      break;
    }
  }

  return coords;
}

/**
 * Calculate the distance between two points using the Haversine formula
 */
function calculateHaversineDistance(
  point1: GeoPoint,
  point2: GeoPoint,
): number {
  const R = 3958.8; // Earth's radius in miles

  const lat1 = toRadians(point1.latitude);
  const lon1 = toRadians(point1.longitude);
  const lat2 = toRadians(point2.latitude);
  const lon2 = toRadians(point2.longitude);

  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
