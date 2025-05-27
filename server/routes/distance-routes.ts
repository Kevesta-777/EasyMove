/**
 * Distance calculation routes
 * 
 * Provides endpoints for calculating distances and travel times between addresses
 * using the enhanced distance calculator with Google Maps API integration.
 */
import { Request, Response, Router } from 'express';
import { calculateDistance } from '../services/enhanced-distance-calculator';

const router = Router();

// Route for calculating distance between two addresses
router.post('/api/distance', async (req: Request, res: Response) => {
  try {
    const { from, to } = req.body;
    
    // Validate required fields
    if (!from || !to) {
      return res.status(400).json({
        error: 'Missing required fields: from and to addresses are required'
      });
    }
    
    console.log(`Calculating distance from "${from}" to "${to}"`);
    
    // Calculate the distance using our enhanced calculator
    const result = await calculateDistance(from, to);
    
    // Return the result
    res.json({
      success: true,
      ...result,
      source: result.source || 'enhanced_calculator'
    });
  } catch (error: any) {
    console.error('Distance calculation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to calculate distance'
    });
  }
});

export default router;