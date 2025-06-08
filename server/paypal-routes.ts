/**
 * Dedicated PayPal routes file to ensure proper endpoint registration
 * All routes here use non-prefixed paths to work with the PayPal SDK correctly
 */
import express, { Request, Response, Router } from "express";
import { getClientToken, createPaypalOrder, capturePaypalOrder } from "./paypal";

// Create a dedicated router for PayPal routes
const paypalRouter = Router();

// Route to get PayPal client token for setup
paypalRouter.get("/setup", async (req: Request, res: Response) => {
  try {
    console.log('Processing PayPal setup request');
    const startTime = Date.now();
    
    const token = await getClientToken();
    
    console.log(`PayPal token retrieved in ${Date.now() - startTime}ms`);
    
    res.json({
      clientToken: token,
      success: true
    });
  } catch (error: any) {
    console.error('Error in PayPal setup route:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to get PayPal client token', 
      success: false 
    });
  }
});

// Route to create a PayPal order
paypalRouter.post("/order", async (req: Request, res: Response) => {
  try {
    console.log("Processing PayPal order creation request:", req.body);
    const startTime = Date.now();
    
    // Store original json method to be able to measure processing time
    const originalJson = res.json;
    res.json = function(body: any) {
      const processingTime = Date.now() - startTime;
      console.log(`PayPal order created in ${processingTime}ms`);
      
      // Add processing time to response
      const enhancedBody = {
        ...body,
        processingTime,
      };
      
      return originalJson.call(this, enhancedBody);
    };
    
    await createPaypalOrder(req, res);
  } catch (error: any) {
    console.error('Error in PayPal order creation route:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create PayPal order', 
      success: false,
      processingTime: Date.now() - (req.body.startTime || Date.now())
    });
  }
});

// Route to capture a PayPal order
paypalRouter.post("/order/:orderID/capture", async (req: Request, res: Response) => {
  try {
    console.log("Processing PayPal order capture request:", req.params.orderID);
    const startTime = Date.now();
    
    // Store original json method to be able to measure processing time
    const originalJson = res.json;
    res.json = function(body: any) {
      const processingTime = Date.now() - startTime;
      console.log(`PayPal order captured in ${processingTime}ms`);
      
      // Add processing time to response
      const enhancedBody = {
        ...body,
        processingTime,
      };
      
      return originalJson.call(this, enhancedBody);
    };
    
    await capturePaypalOrder(req, res);
  } catch (error: any) {
    console.error('Error in PayPal order capture route:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to capture PayPal order', 
      success: false,
      processingTime: Date.now() - (req.body.startTime || Date.now())
    });
  }
});

// Route for warm-up
paypalRouter.get("/warmup", async (req: Request, res: Response) => {
  try {
    console.log('Processing PayPal warmup request');
    const startTime = Date.now();
    
    // Get the client token to warm up the connection
    await getClientToken();
    
    const processingTime = Date.now() - startTime;
    
    console.log(`PayPal warm-up completed in ${processingTime}ms`);
    
    res.json({
      success: true,
      processingTime,
      message: 'PayPal API warmed up successfully'
    });
  } catch (error: any) {
    console.error('Error in PayPal warmup route:', error);
    res.status(500).json({
      error: 'Failed to warm up PayPal',
      message: error.message,
      success: false
    });
  }
});

export default paypalRouter;