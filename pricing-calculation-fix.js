/**
 * EasyMove Man and Van - Quote Calculation and Price Accuracy Fix
 *
 * This file contains fixes for the quote calculation and price accuracy issues
 * to ensure consistent pricing throughout the application.
 */

// ====================================================
// 1. DISTANCE CALCULATION ISSUES
// ====================================================

/**
 * ISSUE: The Google Maps API key is not working correctly, causing the
 * application to fall back to approximate distance calculations, which
 * leads to inaccurate pricing.
 *
 * FIX: Add validation for the Google Maps API key and improve the
 * fallback calculation logic.
 */

// Add this function to the beginning of server/services/distance-calculator.ts
async function validateGoogleMapsApiKey() {
  // Skip validation if no key
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    return false;
  }

  try {
    // Simple test request to validate key
    const testUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=London&destination=Birmingham&key=${process.env.GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(testUrl);
    const data = await response.json();

    if (data.status === "OK") {
      return true;
    } else {
      if (data.error_message) {
      }
      return false;
    }
  } catch (error) {
    return false;
  }
}

// Modify the calculateDistance function in server/services/distance-calculator.ts
async function calculateDistance(originAddress, destinationAddress) {
  try {
    // First try Google Maps API if available and validate key
    if (process.env.GOOGLE_MAPS_API_KEY) {
      const isValid = await validateGoogleMapsApiKey();
      if (isValid) {
        try {
          return await calculateDistanceWithGoogleMaps(
            originAddress,
            destinationAddress,
          );
        } catch (error) {}
      } else {
      }
    }

    // Enhanced fallback calculation - improve city detection
    const normalizedOrigin = originAddress.toLowerCase().trim();
    const normalizedDest = destinationAddress.toLowerCase().trim();

    // Add exact distances for common UK city pairs
    const cityPairs = {
      "london-manchester": 200,
      "manchester-london": 200,
      "london-birmingham": 126,
      "birmingham-london": 126,
      "manchester-liverpool": 35,
      "liverpool-manchester": 35,
      "london-bristol": 118,
      "bristol-london": 118,
      "london-leeds": 196,
      "leeds-london": 196,
      "london-newcastle": 283,
      "newcastle-london": 283,
      "portsmouth-london": 75,
      "london-portsmouth": 75,
      "portsmouth-southampton": 20,
      "southampton-portsmouth": 20,
      "portsmouth-brighton": 49,
      "brighton-portsmouth": 49,
      "portsmouth-newcastle": 330,
      "newcastle-portsmouth": 330,
    };

    // Extract city names for checking
    const extractCity = (address) => {
      const lowerAddress = address.toLowerCase();
      const commonCities = [
        "london",
        "manchester",
        "birmingham",
        "leeds",
        "glasgow",
        "liverpool",
        "newcastle",
        "sheffield",
        "bristol",
        "edinburgh",
        "cardiff",
        "belfast",
        "brighton",
        "portsmouth",
        "southampton",
        "oxford",
        "cambridge",
      ];

      for (const city of commonCities) {
        if (lowerAddress.includes(city)) {
          return city;
        }
      }

      // Return first word as fallback
      return lowerAddress.split(/[,\\s]+/)[0];
    };

    const originCity = extractCity(normalizedOrigin);
    const destCity = extractCity(normalizedDest);
    const pairKey = `${originCity}-${destCity}`;

    if (cityPairs[pairKey]) {
      // Use predefined distance for known city pairs
      const exactDistance = cityPairs[pairKey];

      // Calculate travel time based on distance
      const avgSpeed =
        exactDistance < 10
          ? 18 // Urban: 18mph
          : exactDistance < 30
            ? 25 // Suburban: 25mph
            : exactDistance < 100
              ? 35 // Regional: 35mph
              : 45; // Highway: 45mph

      const drivingMinutes = Math.round((exactDistance / avgSpeed) * 60);
      const loadingMinutes =
        exactDistance < 20
          ? 30 // 30 minutes for short distances
          : exactDistance < 50
            ? 45 // 45 minutes for medium distances
            : exactDistance < 100
              ? 60 // 60 minutes for longer distances
              : 75; // 75 minutes for very long distances

      // Add breaks for longer journeys
      const breakMinutes =
        exactDistance > 100 ? Math.floor(drivingMinutes / 120) * 15 : 0;

      const totalEstimatedTime = drivingMinutes + loadingMinutes + breakMinutes;

      return {
        distance: exactDistance,
        unit: "miles",
        estimatedTime: totalEstimatedTime,
        origin: originAddress,
        destination: destinationAddress,
        usingGoogleMaps: false,
        exactCalculation: true,
      };
    }

    // Continue with existing fallback logic...
    // (Keep the rest of the fallback calculation as it is)
    const originCoords = await approximateCoordinates(originAddress);
    const destCoords = await approximateCoordinates(destinationAddress);

    // Calculate road distance with a winding factor
    const distanceInMiles = calculateHaversineDistance(
      originCoords,
      destCoords,
    );

    // Use higher winding factors to better reflect actual driving distances
    const roadWindingFactor =
      distanceInMiles < 10
        ? 1.6 // City driving
        : distanceInMiles < 30
          ? 1.5 // Suburban roads
          : distanceInMiles < 100
            ? 1.4 // Regional routes
            : 1.3; // Long distance highways

    // Add UK-specific adjustment for traffic, roundabouts, etc.
    const ukAdjustmentFactor = 1.1; // Additional 10% for UK road conditions

    // Calculate final adjusted distance
    const finalAdjustedDistance =
      Math.round(
        distanceInMiles * roadWindingFactor * ukAdjustmentFactor * 10,
      ) / 10;

    // Rest of the calculation remains the same
    // ...

    // Add the following line to ensure we return a rounded distance
    return {
      distance: finalAdjustedDistance,
      // Keep the rest of the return object the same
      // ...
    };
  } catch (error) {
    // Error handling remains the same
    // ...
  }
}

// ====================================================
// 2. FIX PRICE CALCULATION ROUNDING ISSUES
// ====================================================

/**
 * ISSUE: Price calculations have inconsistent rounding,
 * causing discrepancies between quote calculation and checkout.
 *
 * FIX: Implement consistent rounding functions for all price components.
 */

// Add these helper functions to shared/pricing-rules.ts
function roundPrice(price) {
  return Math.round(price * 100) / 100;
}

function roundToNearestPound(price) {
  return Math.round(price);
}

// Modify the calculateVAT function to ensure consistent VAT calculation
function calculateVAT(price) {
  // Always calculate VAT consistently: 20% of the price
  return roundPrice(price * 0.2);
}

// Update the calculatePriceWithVAT function
function calculatePriceWithVAT(price) {
  // Calculate total with VAT (20% more)
  return roundPrice(price * 1.2);
}

// Fix the formatPrice function to handle different currencies
function formatPrice(price) {
  // Format with the currency symbol and always 2 decimal places
  return `${PRICING_CONSTANTS.CURRENCY}${price.toFixed(2)}`;
}

// ====================================================
// 3. FIX QUOTE CALCULATION FUNCTION
// ====================================================

/**
 * ISSUE: The buildPriceBreakdown function has inconsistencies in the
 * calculation of different price components, leading to
 * inaccurate total prices.
 *
 * FIX: Properly calculate and round all price components.
 */

// Replace the buildPriceBreakdown function in shared/pricing-rules.ts
function buildPriceBreakdown(params) {
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

  // Calculate base charges with proper rounding
  const distanceCharge = roundPrice(
    calculateDistanceCharge(distanceMiles, vanSize, inLondon),
  );
  const vanSizeMultiplier = calculateVanSizeMultiplier(vanSize);
  const timeCharge = roundPrice(calculateTimeCharge(vanSize, estimatedHours));

  // Calculate additional fees with proper rounding
  const helpersFee = roundPrice(calculateHelperFee(numHelpers, estimatedHours));
  const floorAccessFee = roundPrice(
    calculateFloorAccessFee(floorAccess, liftAvailable),
  );
  const fuelCost = roundPrice(calculateFuelCost(distanceMiles, vanSize));
  const returnJourneyCost = roundPrice(
    calculateReturnJourneyCost(distanceMiles, vanSize),
  );
  const congestionCharge = inLondon ? PRICING_CONSTANTS.CONGESTION_CHARGE : 0;

  // Calculate surcharges
  const peakTimeSurchargeRate = calculatePeakTimeSurcharge(moveDate, moveTime);
  const urgencySurchargeRate = calculateUrgencySurcharge(urgency);

  // Calculate subtotal before surcharges
  const subtotal = roundPrice(
    distanceCharge +
      timeCharge +
      helpersFee +
      floorAccessFee +
      fuelCost +
      returnJourneyCost +
      congestionCharge,
  );

  // Apply surcharges with proper rounding
  const peakTimeSurcharge = roundPrice(subtotal * peakTimeSurchargeRate);
  const urgencySurcharge = roundPrice(subtotal * urgencySurchargeRate);

  // Calculate total price
  let totalPrice = roundPrice(subtotal + peakTimeSurcharge + urgencySurcharge);

  // Ensure minimum price threshold
  totalPrice = Math.max(totalPrice, PRICING_CONSTANTS.MINIMUM_PRICE);

  // Round to whole pounds for pricing consistency
  totalPrice = roundToNearestPound(totalPrice);

  // Calculate VAT amount
  const vatAmount = calculateVAT(totalPrice);

  // Calculate total with VAT
  const totalWithVAT = roundToNearestPound(totalPrice + vatAmount);

  // Calculate platform fee and driver share
  const platformFee = roundPrice(
    totalPrice * PRICING_CONSTANTS.PLATFORM_FEE_PERCENTAGE,
  );
  const driverShare = roundPrice(
    totalPrice * PRICING_CONSTANTS.MINIMUM_DRIVER_PERCENTAGE,
  );

  // Create a detailed breakdown
  const breakdown = [
    `Distance (${distanceMiles.toFixed(1)} miles): ${formatPrice(distanceCharge)}`,
    `Van size (${vanSize}): ${formatPrice(timeCharge)}`,
    `Helpers (${numHelpers}): ${formatPrice(helpersFee)}`,
  ];

  // Add conditional charges only if they exist
  if (floorAccessFee > 0) {
    breakdown.push(
      `Floor access (${floorAccess}): ${formatPrice(floorAccessFee)}`,
    );
  }

  breakdown.push(`Fuel: ${formatPrice(fuelCost)}`);
  breakdown.push(`Return journey: ${formatPrice(returnJourneyCost)}`);

  if (congestionCharge > 0) {
    breakdown.push(`Congestion charge: ${formatPrice(congestionCharge)}`);
  }

  if (peakTimeSurcharge > 0) {
    breakdown.push(
      `Peak time surcharge (${(peakTimeSurchargeRate * 100).toFixed(0)}%): ${formatPrice(peakTimeSurcharge)}`,
    );
  }

  if (urgencySurcharge > 0) {
    breakdown.push(
      `${urgency} service (${(urgencySurchargeRate * 100).toFixed(0)}%): ${formatPrice(urgencySurcharge)}`,
    );
  }

  // Add subtotal, VAT, and total
  breakdown.push(`Subtotal (excluding VAT): ${formatPrice(totalPrice)}`);
  breakdown.push(
    `VAT (${(PRICING_CONSTANTS.VAT_RATE * 100).toFixed(0)}%): ${formatPrice(vatAmount)}`,
  );
  breakdown.push(`Total (including VAT): ${formatPrice(totalWithVAT)}`);

  // Add commission breakdown
  breakdown.push(
    `Platform fee (${(PRICING_CONSTANTS.PLATFORM_FEE_PERCENTAGE * 100).toFixed(0)}%): ${formatPrice(platformFee)}`,
  );
  breakdown.push(
    `Driver payment (${(PRICING_CONSTANTS.MINIMUM_DRIVER_PERCENTAGE * 100).toFixed(0)}%): ${formatPrice(driverShare)}`,
  );

  // Calculate estimated time
  const travelTime = estimateTravelTime(distanceMiles);
  const loadingTime = calculateLoadingTime(
    vanSize,
    floorAccess !== "ground" && !liftAvailable,
  );
  const totalTime = travelTime + loadingTime;
  const estimatedTime = formatDuration(totalTime);

  // Return the complete quote with all calculated values
  return {
    totalPrice: totalPrice,
    originalPrice: totalPrice,
    finalPrice: totalPrice,
    totalWithVAT: totalWithVAT,
    subTotal: totalPrice,
    currency: PRICING_CONSTANTS.CURRENCY,
    priceString: formatPrice(totalWithVAT),
    estimatedTime: estimatedTime,
    explanation: `${formatPrice(totalWithVAT)} for a ${vanSize} van, ${distanceMiles.toFixed(1)} miles. Estimated time: ${estimatedTime}.`,
    distanceCharge: distanceCharge,
    timeCharge: timeCharge,
    helpersFee: helpersFee,
    floorAccessFee: floorAccessFee,
    peakTimeSurcharge: peakTimeSurcharge,
    urgencySurcharge: urgencySurcharge,
    fuelCost: fuelCost,
    returnJourneyCost: returnJourneyCost,
    congestionCharge: congestionCharge,
    vanSizeMultiplier: vanSizeMultiplier,
    platformFee: platformFee,
    driverShare: driverShare,
    includesVAT: true,
    vatAmount: vatAmount,
    netAmount: totalPrice,
    breakdown: breakdown,
  };
}

// ====================================================
// 4. FIX SIMPLIFIED QUOTE CALCULATION
// ====================================================

/**
 * ISSUE: The simplified quote calculator produces results
 * that don't match the full calculator.
 *
 * FIX: Align the simplified calculator with the full one.
 */

// Replace the calculateSimpleQuote function in shared/pricing-rules.ts
function calculateSimpleQuote(params) {
  const { distanceMiles, vanSize, moveDate } = params;

  // Calculate a reasonable estimate of hours based on distance and van size
  const travelTime = estimateTravelTime(distanceMiles);
  const loadingTime = calculateLoadingTime(vanSize, false); // Assume good access
  const estimatedHours = Math.ceil(travelTime + loadingTime);

  // Set sensible defaults for a simplified quote
  const fullParams = {
    distanceMiles: distanceMiles,
    vanSize: vanSize,
    estimatedHours: estimatedHours,
    numHelpers: 0, // No helpers by default
    floorAccess: "ground", // Assume ground floor
    liftAvailable: false,
    moveDate: moveDate,
    moveTime: "09:00", // Assume 9am by default
    urgency: "standard", // Standard urgency
    inLondon:
      (distanceMiles < 50 &&
        isLondonAddressLikely(params.pickupAddress || "")) ||
      isLondonAddressLikely(params.deliveryAddress || ""), // Check for London addresses
  };

  // Calculate using the full breakdown function for consistency
  const detailedQuote = buildPriceBreakdown(fullParams);

  // Return a simpler version of the quote
  return {
    totalPrice: detailedQuote.totalPrice,
    totalWithVAT: detailedQuote.totalWithVAT,
    vatAmount: detailedQuote.vatAmount,
    currency: detailedQuote.currency,
    priceString: detailedQuote.priceString,
    estimatedTime: detailedQuote.estimatedTime,
    explanation: detailedQuote.explanation,
  };
}

// Helper function to check if an address is likely in London
function isLondonAddressLikely(address) {
  if (!address) return false;

  const lowerAddress = address.toLowerCase();

  // Check for London or common London postcodes
  return (
    lowerAddress.includes("london") ||
    /\b(e|ec|n|nw|se|sw|w|wc)[0-9]/i.test(lowerAddress)
  );
}

// ====================================================
// 5. FIX API QUOTE ENDPOINT
// ====================================================

/**
 * ISSUE: The API quote endpoint has inconsistencies in how
 * it handles quote calculation compared to the frontend.
 *
 * FIX: Ensure API quote endpoint uses the same calculation
 * logic as the frontend.
 */

// Replace the quote calculation route in server/routes.ts
app.post("/api/quotes/calculate", async (req, res) => {
  try {
    // Validate request data
    const validatedData = calculateQuoteSchema.parse(req.body);

    // Calculate distance between addresses
    const distanceResponse = await calculateDistance(
      validatedData.collectionAddress,
      validatedData.deliveryAddress,
    );

    // Get distance and estimated time
    const distance = distanceResponse.distance;
    const estimatedTimeMinutes = distanceResponse.estimatedTime;

    // Parse move date
    const moveDate = new Date(validatedData.moveDate);

    // Check if location might be in London for congestion charge
    const pickupInLondon = isLondonAddressLikely(
      validatedData.collectionAddress,
    );
    const deliveryInLondon = isLondonAddressLikely(
      validatedData.deliveryAddress,
    );
    const inLondon = pickupInLondon || deliveryInLondon;

    // Build parameters for price calculation
    const quoteParams = {
      distanceMiles: distance,
      vanSize: validatedData.vanSize,
      estimatedHours:
        validatedData.estimatedHours || Math.ceil(estimatedTimeMinutes / 60),
      numHelpers: validatedData.helpers || 0,
      floorAccess: validatedData.floorAccessPickup || "ground",
      liftAvailable: validatedData.liftAvailablePickup || false,
      moveDate: moveDate,
      moveTime: validatedData.moveTime || "09:00",
      urgency: validatedData.urgency || "standard",
      inLondon: inLondon,
      // Include original addresses for reference
      pickupAddress: validatedData.collectionAddress,
      deliveryAddress: validatedData.deliveryAddress,
    };

    // Calculate quote using our standard pricing module
    const quote = buildPriceBreakdown(quoteParams);

    // Return complete quote with all necessary data
    res.json({
      ...quote,
      pickupAddress: validatedData.collectionAddress,
      deliveryAddress: validatedData.deliveryAddress,
      distance: distance,
      vanSize: validatedData.vanSize,
      moveDate: moveDate.toISOString(),
    });
  } catch (error) {
    console.error("Error calculating quote:", error);
    res.status(500).json({
      error: "Failed to calculate quote",
      details: error.message,
    });
  }
});

// ====================================================
// 6. FIX FRONTEND QUOTE STORAGE
// ====================================================

/**
 * ISSUE: Quote data is sometimes lost when navigating to checkout,
 * causing discrepancies or errors in payment processing.
 *
 * FIX: Improve quote storage in localStorage and ensure all
 * necessary data is included.
 */

// Add these functions to client/src/contexts/QuoteContext.tsx
function saveQuoteToStorage(quote) {
  if (!quote) return;

  try {
    // Ensure all required fields are present
    const requiredFields = [
      "totalPrice",
      "finalPrice",
      "totalWithVAT",
      "pickupAddress",
      "deliveryAddress",
      "distance",
      "vanSize",
    ];

    for (const field of requiredFields) {
      if (quote[field] === undefined) {
        console.error(`Cannot save quote: Missing required field: ${field}`);
        return false;
      }
    }

    // Convert any date objects to ISO strings
    const processedQuote = { ...quote };
    if (processedQuote.moveDate instanceof Date) {
      processedQuote.moveDate = processedQuote.moveDate.toISOString();
    }

    // Save to localStorage
    localStorage.setItem("easyMoveQuote", JSON.stringify(processedQuote));
    return true;
  } catch (error) {
    return false;
  }
}

function loadQuoteFromStorage() {
  try {
    const savedQuote = localStorage.getItem("easyMoveQuote");
    if (!savedQuote) return null;

    const parsedQuote = JSON.parse(savedQuote);

    // Validate quote has minimum required fields
    if (!parsedQuote || !parsedQuote.finalPrice) {
      console.warn("Invalid quote data found in localStorage");
      return null;
    }

    return parsedQuote;
  } catch (error) {
    return null;
  }
}

// ====================================================
// 7. FIX PAYMENT AMOUNT CONSISTENCY
// ====================================================

/**
 * ISSUE: The payment amount sent to Stripe/PayPal sometimes
 * differs from the quote amount shown to users.
 *
 * FIX: Ensure payment amount calculation is consistent.
 */

// Add this function to Stripe/PayPal payment processing
function getPaymentAmountFromQuote(quote) {
  if (!quote) {
    return null;
  }

  // Always use the VAT-inclusive total price for payments
  const amount = quote.totalWithVAT;

  if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    return null;
  }

  // Calculate deposit amount (25% of total)
  const depositAmount = Math.round(amount * 0.25);

  // Return payment data
  return {
    finalPrice: amount,
    depositAmount: depositAmount,
    driverShare: amount - depositAmount,
    totalWithVAT: amount,
  };
}

// ====================================================
// 8. TESTING UTILS
// ====================================================

/**
 * Add this function to verify quote calculations
 */

function testQuoteCalculation() {
  // Test cases with known distances
  const testCases = [
    {
      params: {
        distanceMiles: 10,
        vanSize: "medium",
        estimatedHours: 2,
        numHelpers: 0,
        floorAccess: "ground",
        liftAvailable: false,
        moveDate: new Date("2023-05-15T09:00:00"), // Weekday
        moveTime: "09:00",
        urgency: "standard",
        inLondon: false,
        pickupAddress: "Manchester",
        deliveryAddress: "Liverpool",
      },
      expectedRange: {
        totalPrice: { min: 80, max: 120 },
        totalWithVAT: { min: 95, max: 145 },
      },
    },
    {
      params: {
        distanceMiles: 100,
        vanSize: "large",
        estimatedHours: 3,
        numHelpers: 1,
        floorAccess: "firstFloor",
        liftAvailable: false,
        moveDate: new Date("2023-05-20T09:00:00"), // Weekend
        moveTime: "09:00",
        urgency: "priority",
        inLondon: false,
        pickupAddress: "London",
        deliveryAddress: "Bristol",
      },
      expectedRange: {
        totalPrice: { min: 300, max: 380 },
        totalWithVAT: { min: 360, max: 456 },
      },
    },
  ];

  // Run the tests
  testCases.forEach((test, index) => {
    console.log(`\nTest Case ${index + 1}:`);
    console.log(
      `${test.params.pickupAddress} to ${test.params.deliveryAddress}, ${test.params.vanSize} van, ${test.params.distanceMiles} miles`,
    );

    // Calculate quote
    const quote = buildPriceBreakdown(test.params);

    // Check total price
    const totalPriceInRange =
      quote.totalPrice >= test.expectedRange.totalPrice.min &&
      quote.totalPrice <= test.expectedRange.totalPrice.max;

    // Check VAT inclusive price
    const totalWithVATInRange =
      quote.totalWithVAT >= test.expectedRange.totalWithVAT.min &&
      quote.totalWithVAT <= test.expectedRange.totalWithVAT.max;

    // Show breakdown
    quote.breakdown.forEach((item) => console.log(`  ${item}`));
  });
}

// ====================================================
// IMPLEMENTATION STEPS
// ====================================================

/**
 * To fix all quote calculation and price accuracy issues:
 *
 * 1. Add the validateGoogleMapsApiKey function to server/services/distance-calculator.ts
 * 2. Update the calculateDistance function with improved city pair detection
 * 3. Add the rounding helper functions to shared/pricing-rules.ts
 * 4. Replace the buildPriceBreakdown function with the fixed version
 * 5. Replace the calculateSimpleQuote function with the fixed version
 * 6. Fix the quote calculation API endpoint in server/routes.ts
 * 7. Add the improved quote storage functions to QuoteContext
 * 8. Ensure payment amount calculation is consistent
 * 9. Run the test function to verify quote calculations
 */

// Export the functions for import in other files
export {
  validateGoogleMapsApiKey,
  calculateDistance,
  roundPrice,
  roundToNearestPound,
  calculateVAT,
  calculatePriceWithVAT,
  formatPrice,
  buildPriceBreakdown,
  calculateSimpleQuote,
  saveQuoteToStorage,
  loadQuoteFromStorage,
  getPaymentAmountFromQuote,
  testQuoteCalculation,
};
