/**
 * Direct routes for PayPal SDK compatibility
 * These routes MUST be registered without the /api prefix
 */
import { Request, Response } from "express";
import { getClientToken, createPaypalOrder, capturePaypalOrder } from "./paypal";

// Route to get PayPal client token for setup
export async function handlePayPalSetup(req: Request, res: Response) {
  try {
    console.log('Processing direct /paypal/setup request');
    const token = await getClientToken();
    res.json({
      clientToken: token,
      success: true
    });
  } catch (error: any) {
    console.error('Error in direct /paypal/setup route:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to get PayPal client token', 
      success: false 
    });
  }
}

// Route to create a PayPal order
export async function handlePayPalOrder(req: Request, res: Response) {
  try {
    console.log("Processing direct /paypal/order request:", req.body);
    await createPaypalOrder(req, res);
  } catch (error: any) {
    console.error('Error in direct /paypal/order route:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create PayPal order', 
      success: false 
    });
  }
}

// Route to capture a PayPal order
export async function handlePayPalCapture(req: Request, res: Response) {
  try {
    console.log("Processing direct /paypal/order/:orderID/capture request:", req.params.orderID);
    await capturePaypalOrder(req, res);
  } catch (error: any) {
    console.error('Error in direct /paypal/order/:orderID/capture route:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to capture PayPal order', 
      success: false 
    });
  }
}

// Route for warm-up
export async function handlePayPalWarmup(req: Request, res: Response) {
  try {
    console.log('Processing direct /paypal/warmup request');
    const startTime = Date.now();
    
    // Get the client token to warm up the connection
    await getClientToken();
    
    const processingTime = Date.now() - startTime;
    console.log(`PayPal direct warm-up completed in ${processingTime}ms`);
    
    res.json({
      success: true,
      processingTime,
      message: 'PayPal API warmed up successfully'
    });
  } catch (error: any) {
    console.error('Error in direct /paypal/warmup route:', error);
    res.status(500).json({
      error: 'Failed to warm up PayPal',
      message: error.message,
      success: false
    });
  }
}