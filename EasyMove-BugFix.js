/**
 * EasyMove Man and Van - Bug Fix Solutions
 * 
 * This file contains specific solutions to common issues with the app,
 * particularly focusing on quote generation and payment processing.
 */

/* ======================= PAYMENT PROCESSING FIXES ======================= */

/**
 * FIX 1: Stripe Payment Intent Creation Error
 * Problem: Client secret not matching Payment Intent when creating payment
 * Solution: Ensure proper API keys and proper initialization
 */
const stripeFix = {
  diagnosis: `
    // Common error: "The client_secret provided does not match any associated PaymentIntent on this account"
    // This happens when the Stripe publishable key and secret key are from different accounts
    // or when the API key isn't properly initialized
  `,
  
  solution: `
    // 1. In server/routes.ts - Proper initialization of Stripe
    import Stripe from 'stripe';
    
    // Make sure stripe is properly initialized before using it
    let stripe: Stripe | null = null;
    let stripeEnabled = false;
    
    function initializeStripe(secretKey?: string) {
      try {
        const key = secretKey || process.env.STRIPE_SECRET_KEY;
        
        if (!key) {
          console.log('Stripe secret key not provided, operating in limited mode');
          return false;
        }
        
        if (!key.startsWith('sk_')) {
          console.log('Invalid Stripe secret key format - Must start with sk_');
          return false;
        }
        
        // Initialize Stripe with secret key
        stripe = new Stripe(key, {
          apiVersion: '2023-10-16',
        });
        
        console.log('Stripe initialized successfully with real API key');
        stripeEnabled = true;
        return true;
      } catch (error) {
        console.error('Failed to initialize Stripe:', error);
        return false;
      }
    }
    
    // Ensure initialization happens at startup
    initializeStripe();
    
    // 2. Then modify the payment intent creation endpoint
    app.post("/api/create-payment-intent", async (req, res) => {
      try {
        if (!stripe || !stripeEnabled) {
          return res.status(500).json({ error: 'Stripe is not configured properly' });
        }

        const { amount, bookingDetails } = req.body;
        
        if (!amount || isNaN(parseFloat(amount))) {
          return res.status(400).json({ error: 'Invalid amount' });
        }

        // Round to nearest whole pounds
        const roundedAmount = Math.round(parseFloat(amount));
        console.log(`Rounded amount: ${roundedAmount} pounds`);
        
        // Calculate deposit (25% of total)
        const depositAmount = Math.ceil(roundedAmount * 0.25) * 100; // Convert to pennies
        console.log(`Deposit amount for Stripe: ${depositAmount} pennies (£${depositAmount/100})`);
        
        // Create payment intent for the deposit amount
        const paymentIntent = await stripe.paymentIntents.create({
          amount: depositAmount,
          currency: 'gbp',
          metadata: {
            fullAmount: roundedAmount.toString(),
            deposit: (depositAmount/100).toString(),
            pickup: bookingDetails?.pickup || '',
            delivery: bookingDetails?.delivery || '',
            vanSize: bookingDetails?.vanSize || ''
          },
        });

        console.log(`Payment intent created: ${paymentIntent.id}`);
        console.log(`Client secret format check: ${paymentIntent.client_secret?.substring(0, 15)}...`);
        
        res.json({ clientSecret: paymentIntent.client_secret });
      } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({ error: 'Failed to create payment intent' });
      }
    });
  `
};

/**
 * FIX 2: PayPal Integration Issues
 * Problem: PayPal button not loading or errors when creating order
 * Solution: Proper PayPal SDK integration and API route mapping
 */
const paypalFix = {
  diagnosis: `
    // Common errors: 
    // 1. "Failed to load the PayPal SDK"
    // 2. Missing PayPal API routes
    // 3. Incorrect client SDK initialization
  `,
  
  solution: `
    // 1. Ensure server/routes.ts has the proper PayPal route mapping
    import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
    
    // Add these routes
    app.get("/api/paypal/setup", async (req, res) => {
      await loadPaypalDefault(req, res);
    });
    
    app.post("/api/paypal/order", async (req, res) => {
      await createPaypalOrder(req, res);
    });
    
    app.post("/api/paypal/order/:orderID/capture", async (req, res) => {
      await capturePaypalOrder(req, res);
    });
    
    // 2. In client/src/components/PayPalButton.tsx - Proper SDK initialization
    useEffect(() => {
      const loadPayPalSDK = async () => {
        try {
          if (!(window as any).paypal) {
            const script = document.createElement("script");
            script.src = import.meta.env.PROD
              ? "https://www.paypal.com/web-sdk/v6/core"
              : "https://www.sandbox.paypal.com/web-sdk/v6/core";
            script.async = true;
            script.onload = () => initPayPal();
            document.body.appendChild(script);
          } else {
            await initPayPal();
          }
        } catch (e) {
          console.error("Failed to load PayPal SDK", e);
        }
      };
    
      loadPayPalSDK();
    }, []);
    
    const initPayPal = async () => {
      try {
        const clientToken: string = await fetch("/api/paypal/setup")
          .then((res) => res.json())
          .then((data) => {
            return data.clientToken;
          });
        
        // Initialize PayPal SDK with the client token
        const sdkInstance = await (window as any).paypal.createInstance({
          clientToken,
          components: ["paypal-payments"],
        });
        
        // Rest of the implementation...
      } catch (e) {
        console.error(e);
      }
    };
  `
};

/* ==================== QUOTE CALCULATION FIXES ==================== */

/**
 * FIX 3: Inaccurate Price Calculation
 * Problem: Final quote amount is incorrect or inconsistent
 * Solution: Fix the calculation logic and add proper rounding
 */
const quoteCalculationFix = {
  diagnosis: `
    // Common issues:
    // 1. Inconsistent rounding causing price discrepancies
    // 2. VAT calculation errors
    // 3. Improper multiplier application
  `,
  
  solution: `
    // In shared/pricing-rules.ts
    
    // Fix for consistent rounding in price calculations
    export function calculateDistanceCharge(distanceMiles: number, vanSize: VanSize = 'medium', isUrban: boolean = false): number {
      // Determine per-mile rate based on distance and area type
      const perMileRate = isUrban || distanceMiles < 10 ?
        PRICING_CONSTANTS.BASE_RATE_PER_MILE_MAX :
        PRICING_CONSTANTS.BASE_RATE_PER_MILE_MIN;
        
      // Round to 2 decimal places for consistency
      return Math.round((PRICING_CONSTANTS.MINIMUM_PRICE + (distanceMiles * perMileRate)) * 100) / 100;
    }
    
    // Fix for accurate VAT calculation
    export function calculateVAT(price: number): number {
      // Calculate VAT from gross price (price already includes VAT)
      // Formula: VAT = price - (price / (1 + VAT_RATE))
      return Math.round((price - (price / (1 + PRICING_CONSTANTS.VAT_RATE))) * 100) / 100;
    }
    
    // Fix for calculating total price with VAT
    export function calculatePriceWithVAT(price: number): number {
      // Add VAT to net price
      return Math.round(price * (1 + PRICING_CONSTANTS.VAT_RATE));
    }
    
    // Make sure all multipliers are applied in the correct order
    export function buildPriceBreakdown(params: { /* params */ }): { /* return type */ } {
      // Extract parameters
      const { distanceMiles, vanSize, helpers, /* other params */ } = params;
      
      // Calculate base costs with proper rounding
      const distanceCharge = calculateDistanceCharge(distanceMiles, vanSize, isUrban);
      const vanSizeMultiplier = calculateVanSizeMultiplier(vanSize);
      
      // Apply van size multiplier correctly
      const vanSizeAdjustedCharge = Math.round(distanceCharge * vanSizeMultiplier * 100) / 100;
      
      // Calculate other components
      // ...
      
      // Calculate subtotal with all components (before VAT)
      const subtotal = (
        vanSizeAdjustedCharge +
        timeCharge +
        helpersFee +
        floorAccessFee +
        peakTimeSurcharge +
        urgencySurcharge +
        fuelCost +
        returnJourneyCost
      );
      
      // Round to the nearest pound for the final price
      const totalBeforeVAT = Math.round(subtotal);
      
      // Calculate VAT
      const vatAmount = calculateVAT(totalBeforeVAT);
      
      // Add VAT for total price
      const totalWithVAT = totalBeforeVAT + vatAmount;
      
      // Ensure the total is always rounded to the nearest pound
      const finalTotal = Math.round(totalWithVAT);
      
      // Return the complete price breakdown
      return {
        breakdown: [ /* breakdown items */ ],
        totalPrice: totalBeforeVAT,
        totalWithVAT: finalTotal,
        // Other properties
      };
    }
  `
};

/**
 * FIX 4: Missing or Incorrect Quote Parameters
 * Problem: Quote parameters are not properly passed or saved
 * Solution: Implement proper parameter handling and validation
 */
const quoteParameterFix = {
  diagnosis: `
    // Common issues:
    // 1. Missing parameters when generating quotes
    // 2. Quote parameters lost when navigating between pages
    // 3. Inconsistent state between quote calculation and checkout
  `,
  
  solution: `
    // 1. In client/src/contexts/QuoteContext.tsx
    
    export function QuoteProvider({ children }) {
      const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
      
      // Save quote to localStorage whenever it changes
      useEffect(() => {
        if (currentQuote) {
          localStorage.setItem('easymove_quote', JSON.stringify(currentQuote));
          console.log('Quote saved to localStorage:', currentQuote);
        }
      }, [currentQuote]);
      
      // Load quote from localStorage on initial load
      useEffect(() => {
        loadQuoteFromLocalStorage();
      }, []);
      
      // Function to load quote from localStorage
      const loadQuoteFromLocalStorage = () => {
        try {
          const savedQuote = localStorage.getItem('easymove_quote');
          if (savedQuote) {
            const parsedQuote = JSON.parse(savedQuote);
            // Ensure date is properly parsed back to Date object
            if (parsedQuote.moveDate) {
              parsedQuote.moveDate = new Date(parsedQuote.moveDate);
            }
            setCurrentQuote(parsedQuote);
            console.log('Quote loaded from localStorage:', parsedQuote);
            return true;
          }
        } catch (error) {
          console.error('Error loading quote from localStorage:', error);
        }
        return false;
      };
      
      // Generate a new quote with validation
      const generateQuote = async (params) => {
        try {
          // Validate required parameters
          if (!params.vanSize || !params.pickupAddress || !params.deliveryAddress) {
            throw new Error('Missing required parameters for quote generation');
          }
          
          // Ensure moveDate is a valid Date object
          if (!params.moveDate || !(params.moveDate instanceof Date)) {
            params.moveDate = new Date();
          }
          
          // Generate quote
          // ...
          
          // Save to state and localStorage
          setCurrentQuote(generatedQuote);
          return generatedQuote;
        } catch (error) {
          console.error('Error generating quote:', error);
          throw error;
        }
      };
      
      return (
        <QuoteContext.Provider value={{
          currentQuote,
          setCurrentQuote,
          generateQuote,
          loadQuoteFromLocalStorage,
          // Other methods
        }}>
          {children}
        </QuoteContext.Provider>
      );
    }
    
    // 2. In client/src/pages/Checkout.tsx
    
    export default function Checkout() {
      const { currentQuote, loadQuoteFromLocalStorage } = useQuote();
      const [, setLocation] = useLocation();
      const { toast } = useToast();
      
      // Ensure we have a quote to work with
      useEffect(() => {
        if (!currentQuote) {
          const loaded = loadQuoteFromLocalStorage();
          if (!loaded) {
            toast({
              title: "No booking found",
              description: "Please get a quote first before proceeding to checkout",
              variant: "destructive",
            });
            setLocation("/");
          }
        }
      }, [currentQuote, loadQuoteFromLocalStorage, setLocation, toast]);
      
      // Rest of component
    }
  `
};

/* ======================= SERVER CONNECTIVITY FIXES ======================= */

/**
 * FIX 5: API Endpoint Connectivity Issues
 * Problem: Frontend cannot connect to backend API endpoints
 * Solution: Ensure proper API route configuration and CORS
 */
const apiConnectivityFix = {
  diagnosis: `
    // Common issues:
    // 1. 404 errors when trying to access API endpoints
    // 2. CORS errors when making API requests
    // 3. Incorrect API path prefixes
  `,
  
  solution: `
    // 1. In server/index.ts - ensure proper Express setup with CORS
    
    import express from 'express';
    import cors from 'cors';
    import path from 'path';
    import { createServer } from 'http';
    import { registerRoutes } from './routes';
    
    const app = express();
    const PORT = parseInt(process.env.PORT || '5000', 10);
    
    // Enable CORS for development
    app.use(cors());
    
    // Parse JSON body for API requests
    app.use(express.json());
    
    // Special handling for Stripe webhooks (raw body)
    app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));
    
    // Register all API routes
    registerRoutes(app);
    
    // Serve static files for production
    if (process.env.NODE_ENV === 'production') {
      app.use(express.static(path.join(__dirname, '../client/dist')));
      
      // Fallback for client-side routing
      app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
      });
    }
    
    // Start the server
    const server = createServer(app);
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    
    // 2. In client/src/lib/queryClient.ts - ensure proper API request handling
    
    // API request utility to handle prefixing and error management
    export async function apiRequest(
      method: 'GET' | 'POST' | 'PUT' | 'DELETE', 
      endpoint: string,
      data?: any
    ) {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      };
      
      // Add body for non-GET requests
      if (method !== 'GET' && data) {
        options.body = JSON.stringify(data);
      }
      
      // Add API prefix if not already included
      const apiEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
      
      try {
        const response = await fetch(apiEndpoint, options);
        
        // Handle HTTP errors
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `API request failed with status ${response.status}`);
        }
        
        return response;
      } catch (error) {
        console.error(`API request error for ${apiEndpoint}:`, error);
        throw error;
      }
    }
  `
};

/**
 * FIX 6: Database Connectivity Issues
 * Problem: Database connection failures or schema mismatches
 * Solution: Proper database initialization and error handling
 */
const databaseFix = {
  diagnosis: `
    // Common issues:
    // 1. Database connection errors
    // 2. Schema migration failures
    // 3. Missing tables or columns
  `,
  
  solution: `
    // 1. In server/db.ts - robust database connection
    
    import { Pool } from 'pg';
    import { drizzle } from 'drizzle-orm/node-postgres';
    import * as schema from '../shared/schema';
    
    // Create a pool with connection retries
    export const createDbPool = () => {
      const connectionString = process.env.DATABASE_URL;
      
      if (!connectionString) {
        console.error('DATABASE_URL environment variable not set');
        process.exit(1);
      }
      
      const pool = new Pool({ 
        connectionString,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });
      
      // Add error handler to prevent crashes
      pool.on('error', (err) => {
        console.error('Unexpected database pool error:', err);
      });
      
      return pool;
    };
    
    // Create the pool
    export const pool = createDbPool();
    
    // Create the drizzle ORM instance
    export const db = drizzle(pool, { schema });
    
    // Health check function
    export const checkDbConnection = async () => {
      try {
        const client = await pool.connect();
        client.release();
        return true;
      } catch (error) {
        console.error('Database connection failed:', error);
        return false;
      }
    };
    
    // 2. In server/services/db-setup.ts - safe database initialization
    
    import { migrate } from 'drizzle-orm/node-postgres/migrator';
    import { db, pool } from '../db';
    import * as schema from '../../shared/schema';
    
    export async function setupDatabase() {
      try {
        console.log('Setting up database...');
        
        // Check if tables exist, if not create them
        const result = await pool.query(
          "SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users')"
        );
        
        const tablesExist = result.rows[0].exists;
        
        if (!tablesExist) {
          console.log('Tables do not exist, creating schema...');
          await createTables();
        } else {
          console.log('Tables already exist, skipping creation');
        }
        
        console.log('Database setup complete');
        return true;
      } catch (error) {
        console.error('Database setup failed:', error);
        return false;
      }
    }
    
    async function createTables() {
      // For production, use proper migrations
      // For development/demo, create tables directly
      const queries = [
        /* SQL queries to create tables */
      ];
      
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        for (const query of queries) {
          await client.query(query);
        }
        
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }
  `
};

/* ===================== DEPLOYMENT READINESS CHECKS ===================== */

/**
 * FIX 7: Environment Variable Configuration Issues
 * Problem: Missing or incorrect environment variables
 * Solution: Proper environment variable handling and validation
 */
const environmentVarFix = {
  diagnosis: `
    // Common issues:
    // 1. Missing required environment variables
    // 2. Environment variables not properly loaded
    // 3. Front-end/back-end environment variable mismatch
  `,
  
  solution: `
    // 1. Create a config validation function in server/config.ts
    
    // Required environment variables
    const REQUIRED_ENV_VARS = [
      'DATABASE_URL',
      'STRIPE_SECRET_KEY',
      'VITE_STRIPE_PUBLIC_KEY', // For client-side
      'PAYPAL_CLIENT_ID',
      'PAYPAL_CLIENT_SECRET'
    ];
    
    // Optional environment variables
    const OPTIONAL_ENV_VARS = [
      'STRIPE_WEBHOOK_SECRET',
      'GOOGLE_MAPS_API_KEY'
    ];
    
    export function validateEnvironment() {
      const missing = [];
      
      // Check required variables
      for (const envVar of REQUIRED_ENV_VARS) {
        if (!process.env[envVar]) {
          missing.push(envVar);
        }
      }
      
      // Report missing variables
      if (missing.length > 0) {
        console.error('Missing required environment variables:', missing.join(', '));
        console.error('Please set these environment variables before starting the application');
        
        // In development, don't exit but warn
        if (process.env.NODE_ENV !== 'development') {
          process.exit(1);
        }
      }
      
      // Warn about missing optional variables
      const missingOptional = [];
      for (const envVar of OPTIONAL_ENV_VARS) {
        if (!process.env[envVar]) {
          missingOptional.push(envVar);
        }
      }
      
      if (missingOptional.length > 0) {
        console.warn('Missing optional environment variables:', missingOptional.join(', '));
        console.warn('Some features may be limited or disabled');
      }
      
      // Validate format of important variables
      if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
        console.error('Invalid STRIPE_SECRET_KEY format. Must start with sk_');
      }
      
      if (process.env.VITE_STRIPE_PUBLIC_KEY && !process.env.VITE_STRIPE_PUBLIC_KEY.startsWith('pk_')) {
        console.error('Invalid VITE_STRIPE_PUBLIC_KEY format. Must start with pk_');
      }
      
      // Return success status
      return missing.length === 0;
    }
    
    // 2. Call this validation function at startup in server/index.ts
    
    import { validateEnvironment } from './config';
    
    // Validate environment at startup
    const validEnv = validateEnvironment();
    if (!validEnv && process.env.NODE_ENV === 'production') {
      console.error('Environment validation failed in production mode. Exiting.');
      process.exit(1);
    }
  `
};

/**
 * FIX 8: Payment Testing Utilities
 * Problem: Difficulty testing payment flows
 * Solution: Helper utilities for testing payment integrations
 */
const paymentTestingFix = {
  diagnosis: `
    // Common issues:
    // 1. Difficulty testing payment flows without live payments
    // 2. No way to verify payment processing works before deployment
    // 3. Error handling not robust enough for payment failures
  `,
  
  solution: `
    // 1. Create a payment testing utility in server/services/payment-testing.ts
    
    import Stripe from 'stripe';
    import { Client, Environment } from '@paypal/paypal-server-sdk';
    
    export async function testStripeConnection() {
      try {
        const secretKey = process.env.STRIPE_SECRET_KEY;
        if (!secretKey) {
          return { success: false, message: 'Stripe secret key not configured' };
        }
        
        const stripe = new Stripe(secretKey, { apiVersion: '2023-10-16' });
        
        // Test if we can access the Stripe API
        const balance = await stripe.balance.retrieve();
        
        return { 
          success: true, 
          message: 'Successfully connected to Stripe API', 
          details: { available: balance.available }
        };
      } catch (error) {
        return { 
          success: false, 
          message: 'Failed to connect to Stripe API', 
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }
    
    export async function testPayPalConnection() {
      try {
        const clientId = process.env.PAYPAL_CLIENT_ID;
        const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
        
        if (!clientId || !clientSecret) {
          return { success: false, message: 'PayPal credentials not configured' };
        }
        
        // Create a PayPal client
        const environment = process.env.NODE_ENV === 'production' ? 
          Environment.Production : Environment.Sandbox;
        
        const client = new Client({
          clientCredentialsAuthCredentials: {
            oAuthClientId: clientId,
            oAuthClientSecret: clientSecret,
          },
          environment
        });
        
        // Test if we can access the PayPal API
        // For true verification, we would need to make an actual API call
        
        return { 
          success: true, 
          message: 'PayPal client initialized successfully',
          details: { environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox' }
        };
      } catch (error) {
        return { 
          success: false, 
          message: 'Failed to initialize PayPal client', 
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }
    
    // 2. Create a diagnostic endpoint in server/routes.ts
    
    // Diagnostic route for payment provider testing
    // Careful! Only enable in development or with admin authentication
    if (process.env.NODE_ENV !== 'production') {
      app.get('/api/diagnostics/payments', async (req, res) => {
        const results = {
          stripe: await testStripeConnection(),
          paypal: await testPayPalConnection()
        };
        
        res.json(results);
      });
    }
  `
};

/* ===== EXPORT ALL FIXES FOR EASY REFERENCE ===== */
module.exports = {
  stripeFix,
  paypalFix,
  quoteCalculationFix,
  quoteParameterFix,
  apiConnectivityFix,
  databaseFix,
  environmentVarFix,
  paymentTestingFix,
  
  // Quick reference guide
  quickFixGuide: `
    EasyMove Man and Van - Quick Fix Guide
    
    1. STRIPE PAYMENT ISSUES
       - Check Stripe API keys (must be from same account)
       - Secret key must start with sk_
       - Public key must start with pk_
       - Properly initialize Stripe before creating payment intents
    
    2. PAYPAL INTEGRATION ISSUES
       - Ensure correct API routes are mapped
       - SDK must be loaded asynchronously
       - Client token must be fetched from server
    
    3. QUOTE CALCULATION ISSUES
       - Ensure consistent rounding throughout calculations
       - Apply multipliers in correct order
       - Validate all required parameters
    
    4. CHECKOUT FLOW ISSUES
       - Save quote to localStorage for persistence
       - Validate quote exists before checkout
       - Properly format amounts (pennies for Stripe, full amounts for display)
    
    5. API CONNECTIVITY ISSUES
       - Enable CORS for development
       - Use proper API prefixes consistently
       - Handle errors gracefully
    
    6. DATABASE ISSUES
       - Properly initialize connection with error handling
       - Ensure schema matches between code and database
       - Use transactions for important operations
    
    7. DEPLOYMENT ISSUES
       - Validate all environment variables
       - Use proper environment-specific configuration
       - Test payment providers before going live
  `
};
