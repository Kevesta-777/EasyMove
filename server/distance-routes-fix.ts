/**
 * DISTANCE CALCULATION ROUTES FIX
 * 
 * This file contains the updated route handlers for calculating distances
 * and quotes using the fixed distance calculator.
 */

import type { Express, Request, Response } from "express";
import { calculateDistance } from "./services/fixed-distance-calculator";
import { 
  calculateSimpleQuote, 
  buildPriceBreakdown, 
  VanSize, 
  FloorAccess, 
  UrgencyLevel 
} from "../shared/pricing-rules";

/**
 * Route for calculating distances between two addresses
 */
export function registerDistanceRoutes(app: Express) {
  // Distance calculation API endpoint
  app.post("/api/distance", async (req: Request, res: Response) => {
    try {
      const { from, to } = req.body;
      
      if (!from || !to) {
        return res.status(400).json({
          error: 'Missing addresses: both "from" and "to" addresses are required'
        });
      }
      
      // Use our fixed distance calculator
      const distanceResponse = await calculateDistance(from, to);
      
      // Return detailed distance information
      res.json({
        ...distanceResponse,
        origin: from,
        destination: to,
        calculationMethod: distanceResponse.exactCalculation ? 'exact_calculation' : 'approximation'
      });
    } catch (error: any) {
      console.error('Error calculating distance:', error);
      
      // Include a default response with safe fallback values
      const fromAddress = req.body ? (req.body.from || '') : '';
      const toAddress = req.body ? (req.body.to || '') : '';
      
      res.status(500).json({
        error: error.message || 'Failed to calculate distance',
        distance: 0,
        unit: 'miles',
        estimatedTime: 0,
        origin: fromAddress,
        destination: toAddress,
        exactCalculation: false,
        calculationMethod: 'error'
      });
    }
  });

  // Quote calculation API endpoint
  app.post("/api/quotes/calculate", async (req: Request, res: Response) => {
    try {
      // Get quote data from request
      const quoteData = req.body;
      
      // Validate essential fields
      if (!quoteData.collectionAddress || !quoteData.deliveryAddress) {
        return res.status(400).json({ error: 'Missing addresses' });
      }
      
      // Calculate distance between addresses using our fixed calculator
      const distanceResponse = await calculateDistance(
        quoteData.collectionAddress, 
        quoteData.deliveryAddress
      );
      
      // Use the calculated distance
      const distance = distanceResponse.distance;
      
      // Parse move date
      const moveDate = new Date(quoteData.moveDate || new Date());
      
      // Check if locations might be in London for congestion charge
      const inLondon = quoteData.collectionAddress?.toLowerCase().includes('london') || 
                       quoteData.deliveryAddress?.toLowerCase().includes('london');
      
      // Build parameters for price calculation
      const quoteParams = {
        distanceMiles: distance,
        vanSize: quoteData.vanSize as VanSize || 'medium',
        estimatedHours: quoteData.estimatedHours || Math.ceil(distanceResponse.estimatedTime / 60),
        numHelpers: quoteData.helpers || 0,
        floorAccess: quoteData.floorAccessPickup as FloorAccess || 'ground',
        liftAvailable: quoteData.liftAvailablePickup || false,
        moveDate: moveDate,
        moveTime: quoteData.moveTime || '09:00',
        urgency: quoteData.urgency as UrgencyLevel || 'standard',
        inLondon: inLondon
      };
      
      // Calculate detailed price breakdown
      const quote = buildPriceBreakdown(quoteParams);
      
      // Add distance information and address details
      const response = {
        ...quote,
        distance: distance,
        estimatedTime: distanceResponse.estimatedTime,
        pickupAddress: quoteData.collectionAddress,
        deliveryAddress: quoteData.deliveryAddress,
        vanSize: quoteData.vanSize || 'medium',
        moveDate: moveDate.toISOString()
      };
      
      res.json(response);
    } catch (error: any) {
      console.error("Error calculating quote:", error);
      res.status(500).json({
        error: "Failed to calculate quote",
        details: error.message
      });
    }
  });

  // Simple quote API endpoint for quick estimates
  app.post("/api/quotes/simple", async (req: Request, res: Response) => {
    try {
      const { from, to, vanSize } = req.body;
      
      if (!from || !to) {
        return res.status(400).json({ error: 'Missing addresses' });
      }
      
      // Calculate distance
      const distanceResponse = await calculateDistance(from, to);
      
      // Get simple quote
      const simpleQuote = calculateSimpleQuote({
        distanceMiles: distanceResponse.distance,
        vanSize: vanSize as VanSize || 'medium',
        moveDate: new Date(),
        pickupAddress: from,
        deliveryAddress: to
      });
      
      // Return quote with distance info
      res.json({
        ...simpleQuote,
        distance: distanceResponse.distance,
        estimatedTime: distanceResponse.estimatedTime,
        pickupAddress: from,
        deliveryAddress: to
      });
    } catch (error: any) {
      console.error("Error calculating simple quote:", error);
      res.status(500).json({
        error: "Failed to calculate quote",
        details: error.message
      });
    }
  });
}

/**
 * How to use this in the main routes.ts file:
 * 
 * import { registerDistanceRoutes } from "./distance-routes-fix";
 * 
 * export async function registerRoutes(app: Express): Promise<Server> {
 *   // Register the fixed distance calculation routes
 *   registerDistanceRoutes(app);
 *   
 *   // Rest of route registration...
 *   
 *   return httpServer;
 * }
 */