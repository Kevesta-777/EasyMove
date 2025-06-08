import { storage } from "../storage";

/**
 * Initialize default pricing model if one doesn't exist
 */
export async function initializeDefaultPricingModel() {
  try {
    // Check if there's already an active pricing model
    const existingModel = await storage.getActivePricingModel();
    
    if (!existingModel) {
      console.log("No active pricing model found, creating default model");
      
      // Create default pricing model
      await storage.createPricingModel({
        name: "Default Pricing Model",
        basePrice: 50,
        pricePerMile: 2.5,
        vanSizeMultipliers: {
          small: 1,
          medium: 1.3,
          large: 1.6,
          luton: 2
        },
        urgencyMultipliers: {
          standard: 1,
          priority: 1.3,
          express: 1.7
        },
        demandFactors: {
          low: 0.9,
          medium: 1.0,
          high: 1.3,
          veryHigh: 1.5
        },
        seasonalFactors: {
          spring: 1.0,
          summer: 1.1,
          autumn: 1.0,
          winter: 1.05,
          holiday: 1.2
        },
        isActive: true
      });
      
      // Initialize default area demand for major areas
      const commonAreas = [
        "Newcastle", "Newcastle upon Tyne", "Sunderland", "Durham", 
        "Gateshead", "Middlesbrough", "Northumberland", "South Shields", 
        "North Shields", "Darlington", "Stockton", "Hartlepool"
      ];
      
      for (const area of commonAreas) {
        await storage.updateAreaDemand(area, {
          demandLevel: 1.0,
          activeDrivers: 0,
          pendingBookings: 0
        });
      }
      
      console.log("Default pricing model and area demand data initialized");
    }
  } catch (error) {
    console.error("Error initializing default pricing model:", error);
  }
}