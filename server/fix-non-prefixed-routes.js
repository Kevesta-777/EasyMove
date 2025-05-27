/**
 * This script executes in server/index.ts to intercept and properly route PayPal requests.
 * 
 * It solves the issue where PayPal components expect routes without the /api prefix.
 * This middleware captures those requests and routes them to the appropriate handlers.
 */

// Import required PayPal functions from your PayPal service file
const { createPaypalOrder, capturePaypalOrder, getClientToken } = require('./paypal');

// Define the middleware function that will intercept and process non-prefixed PayPal requests
function setupNonPrefixedPayPalRoutes(app) {
  console.log('Setting up non-prefixed PayPal routes for frontend SDK compatibility');
  
  // Route to handle the PayPal setup endpoint (without /api prefix)
  app.get('/paypal/setup', async (req, res) => {
    try {
      console.log('Processing non-prefixed /paypal/setup request');
      // Get the client token
      const token = await getClientToken();
      // Send the response
      return res.json({
        clientToken: token,
        success: true
      });
    } catch (error) {
      console.error('Error in non-prefixed /paypal/setup route:', error);
      res.status(500).json({
        error: error.message || 'Failed to get PayPal client token',
        success: false
      });
    }
  });

  // Route to handle order creation (without /api prefix)
  app.post('/paypal/order', async (req, res) => {
    console.log('Processing non-prefixed /paypal/order request');
    try {
      // Call the createPaypalOrder function from your PayPal service
      await createPaypalOrder(req, res);
    } catch (error) {
      console.error('Error in non-prefixed /paypal/order route:', error);
      res.status(500).json({
        error: error.message || 'Failed to create PayPal order',
        success: false
      });
    }
  });

  // Route to handle order capture (without /api prefix)
  app.post('/paypal/order/:orderID/capture', async (req, res) => {
    console.log('Processing non-prefixed /paypal/order/:orderID/capture request');
    try {
      // Call the capturePaypalOrder function from your PayPal service
      await capturePaypalOrder(req, res);
    } catch (error) {
      console.error('Error in non-prefixed /paypal/order/:orderID/capture route:', error);
      res.status(500).json({
        error: error.message || 'Failed to capture PayPal order',
        success: false
      });
    }
  });

  // Route for warm-up (without /api prefix)
  app.get('/paypal/warmup', async (req, res) => {
    console.log('Processing non-prefixed /paypal/warmup request');
    try {
      // Get the client token to warm up the connection
      await getClientToken();
      // Send success response
      res.json({
        success: true,
        message: 'PayPal API warmed up successfully'
      });
    } catch (error) {
      console.error('Error in non-prefixed /paypal/warmup route:', error);
      res.status(500).json({
        error: error.message || 'Failed to warm up PayPal',
        success: false
      });
    }
  });
}

module.exports = { setupNonPrefixedPayPalRoutes };