import { db } from "../db";
import { pricingModels } from "../../shared/schema";
import { eq } from "drizzle-orm";

/**
 * Initialize default pricing model if it doesn't exist
 */
export async function initializeDefaultPricingModel() {
  try {
    // Check if a default pricing model already exists
    const existing = await db.select().from(pricingModels).where(eq(pricingModels.name, "default")).limit(1);
    
    if (existing.length > 0) {
      console.log("Default pricing model already exists");
      return;
    }

    // Create default pricing model
    const defaultModel = {
      name: "default",
      basePricePerMile: 130, // £1.30 per mile in pence
      vanSizeMultipliers: {
        small: 1.0,
        medium: 1.1,
        large: 1.2,
        luton: 1.3
      },
      urgencyMultipliers: {
        standard: 1.0,
        priority: 1.2,
        express: 1.5
      },
      demandFactors: {
        low: 0.9,
        normal: 1.0,
        high: 1.1,
        peak: 1.2
      },
      seasonalFactors: {
        low: 0.95,
        normal: 1.0,
        high: 1.05,
        peak: 1.1
      },
      returnJourneyFactor: 0.35, // 35% of outbound journey cost
      isActive: true
    };

    await db.insert(pricingModels).values(defaultModel);
    console.log("Default pricing model created successfully");
  } catch (error) {
    console.error("Error initializing default pricing model:", error);
    throw error;
  }
}