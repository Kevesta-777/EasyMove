import express from 'express';
import cors from 'cors';
import { registerRoutes } from './routes';
import { setupDatabase } from './services/db-setup';
import { setupVite } from './vite';

// ========== PayPal Integration Imports ==========
import { 
  loadPaypalDefault, 
  createPaypalOrder, 
  capturePaypalOrder, 
  getClientToken 
} from './paypal';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== PayPal Direct Routes ==========
// These routes MUST be registered WITHOUT the /api prefix
// Critical for PayPal SDK on the frontend to function correctly
app.get("/paypal/setup", async (req, res) => {
  try {
    console.log('Processing PayPal setup request');
    const startTime = Date.now();
    const token = await getClientToken();
    console.log(`PayPal token retrieved in ${Date.now() - startTime}ms`);
    res.json({ clientToken: token, success: true });
  } catch (error: any) {
    console.error('Error in PayPal setup route:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to get PayPal client token', 
      success: false 
    });
  }
});

app.post("/paypal/order", async (req, res) => {
  try {
    console.log("Processing PayPal order creation request:", req.body);
    await createPaypalOrder(req, res);
  } catch (error: any) {
    console.error('Error in PayPal order creation route:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create PayPal order', 
      success: false
    });
  }
});

app.post("/paypal/order/:orderID/capture", async (req, res) => {
  try {
    console.log("Processing PayPal order capture request:", req.params.orderID);
    await capturePaypalOrder(req, res);
  } catch (error: any) {
    console.error('Error in PayPal order capture route:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to capture PayPal order', 
      success: false
    });
  }
});

// Pre-warm the PayPal connection
console.log('Pre-fetching PayPal token in background...');
getClientToken().then(() => {
  console.log('PayPal token obtained and cached successfully');
  console.log('PayPal ready for fast payment processing');
}).catch(error => {
  console.error('Failed to pre-fetch PayPal token:', error);
});

// Setup database
setupDatabase().catch(console.error);

// Register all routes
registerRoutes(app).then(async server => {
  // Setup Vite for development
  if (process.env.NODE_ENV === 'development') {
    await setupVite(app, server);
  }
  
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});