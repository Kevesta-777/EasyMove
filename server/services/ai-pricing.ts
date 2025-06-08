import { storage } from "../storage";

// Import VanSize type from the client types instead
type VanSize = "small" | "medium" | "large" | "luton";

// Initialize OpenAI client only if API key is available
let openai: any = null;
let MODEL = "gpt-4o"; // the newest OpenAI model

// Only import and initialize OpenAI if the API key is available
if (process.env.OPENAI_API_KEY) {
  const { OpenAI } = require("openai");
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

interface DynamicPricingFactors {
  basePrice: number;
  finalPrice: number;
  distance: number;
  vanSize: VanSize;
  vanSizeMultiplier: number;
  demandMultiplier: number;
  timeMultiplier: number;
  seasonalMultiplier: number;
  urgencyMultiplier: number;
  explanation: string;
}

/**
 * Analyzes market factors to determine dynamic pricing
 */
export async function getDynamicPriceRecommendation(
  basePrice: number,
  distance: number,
  vanSize: VanSize,
  origin: string,
  destination: string,
  moveDate: Date,
  urgency: "standard" | "priority" | "express" = "standard"
): Promise<DynamicPricingFactors> {
  // If OpenAI is not initialized, use default pricing logic
  if (!openai) {
    console.log("OpenAI API not available, using default pricing logic");
    return defaultPricingLogic(basePrice, distance, vanSize, moveDate, urgency);
  }
  try {
    // Get active pricing model
    const pricingModel = await storage.getActivePricingModel();
    
    if (!pricingModel) {
      // Fall back to default multipliers if no pricing model exists
      return defaultPricingLogic(basePrice, distance, vanSize, moveDate, urgency);
    }
    
    // Get area demand information for origin and destination
    const originDemand = await storage.getAreaDemand(extractArea(origin));
    const destinationDemand = await storage.getAreaDemand(extractArea(destination));
    
    // Use OpenAI to analyze dynamic pricing
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `You are an expert pricing algorithm for 'EasyMove', a van transport service. 
          Your job is to analyze transportation factors and recommend a fair, competitive price.
          You must ensure prices are market-competitive while maintaining profitability.
          Respond with only a JSON object containing price factors and multipliers.`
        },
        {
          role: "user",
          content: `Analyze these transportation factors and provide a dynamic price recommendation:
          - Base price: £${basePrice}
          - Distance: ${distance} miles
          - Van size: ${vanSize}
          - Origin: ${origin} (demand level: ${originDemand?.demandLevel || 1.0})
          - Destination: ${destination} (demand level: ${destinationDemand?.demandLevel || 1.0})
          - Date of move: ${moveDate.toISOString().split('T')[0]}
          - Day of week: ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][moveDate.getDay()]}
          - Time of day: ${moveDate.getHours()}:${moveDate.getMinutes().toString().padStart(2, '0')}
          - Urgency level: ${urgency}
          
          IMPORTANT PRICING CONSIDERATIONS:
          1. DISTANCE ACCURACY: Account for actual road miles and traffic conditions, not just straight-line distance
          2. COMPETITION ANALYSIS: UK man-and-van services typically charge £50-60/hour for small vans, £60-80/hour for medium/large vans
          3. TIME EFFICIENCY: Longer distance jobs are more time-efficient (motorway driving)
          4. FUEL COST CALCULATION: Average van fuel consumption is 25-35 MPG, with current fuel prices around £1.60/liter
          5. DRIVER COST: Include driver's hourly rate (£15-25/hour) plus return journey compensation
          6. ROUTE-SPECIFIC FACTORS: Consider toll roads, congestion charges, access restrictions
          7. LOADING/UNLOADING TIME: Factor in approximately 15-30 minutes per location
          8. TYPICAL COMPETITIVE EXAMPLES:
             - 5 miles with small van: £60-80
             - 20 miles with medium van: £100-140
             - 50 miles with large van: £180-250
             - 100 miles with luton van: £300-450
          
          Base your analysis on:
          - Van size multipliers: ${JSON.stringify(pricingModel.vanSizeMultipliers)}
          - Urgency multipliers: ${JSON.stringify(pricingModel.urgencyMultipliers)}
          - Demand factors: ${JSON.stringify(pricingModel.demandFactors)}
          - Seasonal factors: ${JSON.stringify(pricingModel.seasonalFactors)}
          
          The final price should be calculated considering all the above, ensuring it's fair and competitive.
          
          Provide the recommendation in JSON format with these fields:
          - basePrice: number (original base price)
          - finalPrice: number (final rounded price)
          - vanSizeMultiplier: number
          - demandMultiplier: number
          - timeMultiplier: number
          - seasonalMultiplier: number
          - urgencyMultiplier: number
          - explanation: string (detailed explanation including competitive analysis, distance corrections, etc.)
          `
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });
    
    // Parse response
    const content = response.choices[0].message.content || "{}";
    const result = JSON.parse(content) as Partial<DynamicPricingFactors>;
    
    // Record this pricing calculation
    await storage.recordPriceCalculation({
      route: `${origin} to ${destination}`,
      distance,
      vanSize,
      basePrice,
      finalPrice: result.finalPrice || basePrice,
      factors: JSON.stringify({
        vanSizeMultiplier: result.vanSizeMultiplier,
        demandMultiplier: result.demandMultiplier,
        timeMultiplier: result.timeMultiplier,
        seasonalMultiplier: result.seasonalMultiplier,
        urgencyMultiplier: result.urgencyMultiplier,
        explanation: result.explanation
      })
    });
    
    return {
      basePrice,
      distance,
      vanSize,
      finalPrice: result.finalPrice || Math.round(basePrice),
      vanSizeMultiplier: result.vanSizeMultiplier || 1,
      demandMultiplier: result.demandMultiplier || 1,
      timeMultiplier: result.timeMultiplier || 1,
      seasonalMultiplier: result.seasonalMultiplier || 1,
      urgencyMultiplier: result.urgencyMultiplier || 1,
      explanation: result.explanation || "Price based on standard factors"
    };
    
  } catch (error) {
    console.error("Error in AI pricing service:", error);
    
    // Fall back to default pricing if AI fails
    return defaultPricingLogic(basePrice, distance, vanSize, moveDate, urgency);
  }
}

/**
 * Fallback pricing function if AI or pricing model is not available
 */
function defaultPricingLogic(
  basePrice: number,
  distance: number,
  vanSize: VanSize,
  moveDate: Date,
  urgency: "standard" | "priority" | "express"
): DynamicPricingFactors {
  // Updated accurate pricing based on competitive market analysis
  // Van size hourly rates (adjusted for market competitiveness)
  const vanHourlyRates: Record<VanSize, number> = {
    small: 55,
    medium: 70,
    large: 85,
    luton: 100
  };
  
  // Adjusted van size multipliers
  const vanSizeMultipliers: Record<VanSize, number> = {
    small: 1,
    medium: 1.3,
    large: 1.6,
    luton: 2
  };
  
  // Updated urgency multipliers
  const urgencyMultipliers: Record<string, number> = {
    standard: 1,
    priority: 1.25, // Less aggressive markup for competitiveness
    express: 1.5    // Adjusted for market reality
  };
  
  // Time-based factors
  const dayOfWeek = moveDate.getDay();
  const hourOfDay = moveDate.getHours();
  
  // Weekend multiplier (slightly reduced for competitiveness)
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const weekendMultiplier = isWeekend ? 1.15 : 1;
  
  // Peak hour multiplier
  const isPeakHour = (hourOfDay >= 8 && hourOfDay < 10) || (hourOfDay >= 16 && hourOfDay < 19);
  const peakHourMultiplier = isPeakHour ? 1.1 : 1;
  
  // Season multiplier (higher in summer moving season)
  const month = moveDate.getMonth();
  const isSummerSeason = month >= 5 && month <= 8; // June to September
  const seasonalMultiplier = isSummerSeason ? 1.12 : 1;
  
  // Calculate time required for the job
  // Base loading/unloading time (minutes)
  const loadingTime = 30;
  
  // Driving time (accounting for average speed based on distance)
  let avgSpeed = 30; // mph for short distances
  if (distance > 20 && distance <= 50) avgSpeed = 40; // medium distance
  if (distance > 50) avgSpeed = 50; // long distance on highways
  
  // Calculate total job time in hours
  const drivingTimeHours = distance / avgSpeed;
  const loadingTimeHours = loadingTime / 60;
  const totalTimeHours = drivingTimeHours + loadingTimeHours;
  
  // Base calculation using hourly rate * time
  const hourlyRate = vanHourlyRates[vanSize];
  let price = hourlyRate * totalTimeHours;
  
  // Add fuel cost estimation (25-35 MPG depending on van size)
  const mpg = vanSize === 'small' ? 35 : 
              vanSize === 'medium' ? 30 : 
              vanSize === 'large' ? 27 : 25;
  
  const fuelPricePerGallon = 7.0; // Approx £1.60/liter * 4.54 liters/gallon
  const fuelCost = (distance / mpg) * fuelPricePerGallon;
  
  // Add calculated fuel cost to the price
  price += fuelCost;
  
  // Factor in return journey compensation (typically 25-40% of one-way price)
  const returnJourneyFactor = distance < 10 ? 0.4 : 
                              distance < 30 ? 0.3 : 0.25;
  
  price += price * returnJourneyFactor;
  
  // Apply all multipliers
  const vanSizeMultiplier = vanSizeMultipliers[vanSize];
  const urgencyMultiplier = urgencyMultipliers[urgency];
  const timeMultiplier = weekendMultiplier * peakHourMultiplier;
  
  // Calculate competitive final price with all factors
  const adjustedPrice = price * timeMultiplier * seasonalMultiplier * urgencyMultiplier;
  
  // Add minimum base fee to ensure profitability on short distances
  const minimumFee = 50;
  const finalPrice = Math.max(Math.round(adjustedPrice), minimumFee);
  
  // Generate detailed explanation
  let explanation = `Price calculated based on ${distance} miles distance with a ${vanSize} van `;
  explanation += `(estimated ${totalTimeHours.toFixed(1)} hours including loading time). `;
  explanation += `Fuel cost: £${Math.round(fuelCost)}, `;
  
  if (isWeekend) explanation += "weekend rates, ";
  if (isPeakHour) explanation += "peak hour pricing, ";
  if (isSummerSeason) explanation += "summer season adjustment, ";
  if (urgency !== "standard") explanation += `${urgency} service level, `;
  
  explanation += `includes return journey compensation.`;
  
  return {
    basePrice,
    finalPrice,
    distance,
    vanSize,
    vanSizeMultiplier,
    demandMultiplier: 1,
    timeMultiplier,
    seasonalMultiplier,
    urgencyMultiplier,
    explanation
  };
}

/**
 * Helper function to extract area name from address
 */
function extractArea(address: string): string {
  if (!address) return "Unknown";
  
  // Extract the first major area from the address
  const commonAreas = [
    "Newcastle", "Newcastle upon Tyne", "Sunderland", "Durham", 
    "Gateshead", "Middlesbrough", "Northumberland", "South Shields", 
    "North Shields", "Darlington", "Stockton", "Hartlepool"
  ];
  
  const foundArea = commonAreas.find(area => address.includes(area));
  return foundArea || "Unknown";
}