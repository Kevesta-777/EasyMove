/**
 * EasyMove Man and Van - Payment Integration Fix
 * 
 * This file contains fixes for both Stripe and PayPal payment integrations
 * to ensure smooth checkout flow and prevent payment errors.
 */

// ====================================================
// 1. STRIPE PAYMENT INTEGRATION FIX
// ====================================================

/**
 * The Stripe integration is showing errors where the client secret doesn't match
 * the PaymentIntent. This happens when:
 * 1. The Stripe public/secret keys are mismatched
 * 2. The PaymentIntent is created on one account but client uses another account's public key
 * 3. There's an issue with the payment intent creation parameters
 * 
 * SOLUTION:
 * Replace the Stripe implementation with this more reliable version
 */

// SERVER-SIDE CODE FIX

// Replace the Stripe initialization code in server/routes.ts
function initializeStripe() {
  try {
    // Make sure we have both required keys
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('Missing Stripe secret key');
      return null;
    }
    
    // Validate key format (should start with sk_)
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey.startsWith('sk_')) {
      console.error(`Invalid Stripe secret key format: ${secretKey.substring(0, 5)}... - Must start with sk_`);
      return null;
    }
    
    // Validate the publishable key exists and has correct format
    if (!process.env.VITE_STRIPE_PUBLIC_KEY) {
      console.error('Missing Stripe publishable key');
    } else if (!process.env.VITE_STRIPE_PUBLIC_KEY.startsWith('pk_')) {
      console.error(`Invalid Stripe public key format: ${process.env.VITE_STRIPE_PUBLIC_KEY.substring(0, 5)}... - Must start with pk_`);
    }
    
    // Check if keys are accidentally swapped
    if (
      process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('pk_') &&
      process.env.VITE_STRIPE_PUBLIC_KEY && process.env.VITE_STRIPE_PUBLIC_KEY.startsWith('sk_')
    ) {
      console.error('Stripe keys are swapped! You should fix this in your environment variables.');
    }
    
    console.log('Initializing Stripe with valid API key');
    return require('stripe')(secretKey);
  } catch (error) {
    console.error('Error initializing Stripe:', error);
    return null;
  }
}

// Replace the payment intent creation endpoint in server/routes.ts
async function createStripePaymentIntent(req, res) {
  try {
    // Initialize Stripe (or use existing instance)
    const stripe = initializeStripe();
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe configuration error' });
    }
    
    // Get quote from request body
    const { finalPrice, depositAmount } = req.body;
    
    // Validate the final price
    if (!finalPrice || isNaN(parseFloat(finalPrice)) || parseFloat(finalPrice) <= 0) {
      return res.status(400).json({ error: 'Invalid price' });
    }
    
    // Convert to pennies for Stripe (must be integer)
    const amount = Math.round(parseFloat(finalPrice));
    console.log(`Creating payment intent for amount: ${amount}`);
    
    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to pennies
      currency: 'gbp',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        quoteAmount: finalPrice,
        depositAmount: depositAmount || Math.round(finalPrice * 0.25), // 25% deposit if not specified
      },
    });
    
    // Validate the client secret format before sending
    const clientSecret = paymentIntent.client_secret;
    if (!clientSecret || !clientSecret.includes('_secret_')) {
      console.error('Invalid client secret format:', clientSecret);
      return res.status(500).json({ error: 'Invalid payment intent created' });
    }
    
    console.log(`Payment intent created: ${paymentIntent.id}`);
    console.log(`Client secret format check: ${clientSecret.substring(0, 15)}...`);
    
    // Return the client secret to the frontend
    return res.json({ 
      clientSecret: clientSecret,
      paymentIntentId: paymentIntent.id
    });
    
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return res.status(500).json({ 
      error: 'Failed to create payment intent',
      details: error.message
    });
  }
}

// CLIENT-SIDE CODE FIX

// Replace the Stripe checkout component in client/src/pages/StripeCheckout.tsx
const StripeCheckoutComponent = `
import { useState, useEffect, useContext } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { QuoteContext } from '@/contexts/QuoteContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function StripeCheckout() {
  const { toast } = useToast();
  const { quote } = useContext(QuoteContext);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    // Make sure we have the quote data
    if (!quote || !quote.finalPrice) {
      setError('No quote data found. Please go back and create a quote first.');
      return;
    }
    
    console.log('Quote being used for checkout:', quote);
  }, [quote]);
  
  async function handleCheckout() {
    try {
      setIsLoading(true);
      setError('');
      
      if (!quote || !quote.finalPrice) {
        throw new Error('No quote data found. Please go back and create a quote first.');
      }
      
      // Get Stripe public key from environment
      const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
      if (!stripeKey) {
        throw new Error('Stripe public key not configured');
      }
      
      console.log('Using Stripe public key:', stripeKey.substring(0, 8) + '...');
      console.log('Final price for payment intent:', quote.finalPrice);
      
      // Calculate deposit amount (25% of total)
      const depositAmount = Math.round(quote.finalPrice * 0.25);
      
      // Create payment intent on server
      const paymentData = {
        finalPrice: quote.finalPrice,
        depositAmount,
        driverShare: quote.finalPrice - depositAmount,
        totalWithVAT: quote.totalWithVAT
      };
      
      console.log('Creating payment with VAT-inclusive price:', paymentData);
      
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment setup failed');
      }
      
      const { clientSecret, paymentIntentId } = await response.json();
      
      if (!clientSecret) {
        throw new Error('No client secret received from server');
      }
      
      console.log('Successfully received client secret');
      
      // Validate client secret format
      if (!clientSecret.includes('_secret_')) {
        throw new Error('Invalid client secret format received');
      }
      
      console.log('Valid client secret format received');
      
      // Initialize Stripe
      const stripe = await loadStripe(stripeKey);
      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }
      
      // Redirect to Stripe Checkout
      const { error } = await stripe.redirectToCheckout({
        clientSecret,
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to process payment');
      toast({
        title: 'Payment Error',
        description: err.message || 'Failed to process payment',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  // Format price for display
  function formatPrice(price) {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(price);
  }
  
  if (!quote || !quote.finalPrice) {
    return (
      <div className="container mx-auto py-10">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-4">Checkout</h1>
          <p className="text-red-500 mb-4">
            No quote data found. Please go back and create a quote first.
          </p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-10">
      <Card className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Complete Your Booking</h1>
        
        <div className="mb-6 space-y-4">
          <div className="flex justify-between py-2 border-b">
            <span className="font-medium">From:</span>
            <span>{quote.pickupAddress}</span>
          </div>
          
          <div className="flex justify-between py-2 border-b">
            <span className="font-medium">To:</span>
            <span>{quote.deliveryAddress}</span>
          </div>
          
          <div className="flex justify-between py-2 border-b">
            <span className="font-medium">Distance:</span>
            <span>{quote.distance} miles</span>
          </div>
          
          <div className="flex justify-between py-2 border-b">
            <span className="font-medium">Van Size:</span>
            <span className="capitalize">{quote.vanSize}</span>
          </div>
          
          <div className="flex justify-between py-2 border-b">
            <span className="font-medium">Move Date:</span>
            <span>{new Date(quote.moveDate).toLocaleDateString()}</span>
          </div>
          
          <div className="flex justify-between py-2 border-b">
            <span className="font-medium">Estimated Time:</span>
            <span>{quote.estimatedTime}</span>
          </div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-md mb-6">
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total Price:</span>
            <span>{formatPrice(quote.finalPrice)}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Price includes VAT, fuel, and all other charges
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <Button
          onClick={handleCheckout}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700"
          size="lg"
        >
          {isLoading ? 'Processing...' : 'Proceed to Payment'}
        </Button>
        
        <p className="text-sm text-center mt-4 text-gray-500">
          You'll be redirected to our secure payment processor
        </p>
      </Card>
    </div>
  );
}
`;

// ====================================================
// 2. PAYPAL INTEGRATION FIX
// ====================================================

/**
 * The PayPal integration needs to be fixed to properly handle all routes
 * and payment processing.
 */

// Replace the PayPal routes in server/routes.ts
const paypalRoutesFix = `
// PayPal routes
app.get("/api/paypal/setup", async (req, res) => {
  try {
    await loadPaypalDefault(req, res);
  } catch (error) {
    console.error("PayPal setup error:", error);
    res.status(500).json({ error: "Failed to setup PayPal" });
  }
});

app.post("/api/paypal/order", async (req, res) => {
  try {
    await createPaypalOrder(req, res);
  } catch (error) {
    console.error("PayPal order creation error:", error);
    res.status(500).json({ error: "Failed to create PayPal order" });
  }
});

app.post("/api/paypal/order/:orderID/capture", async (req, res) => {
  try {
    await capturePaypalOrder(req, res);
  } catch (error) {
    console.error("PayPal capture error:", error);
    res.status(500).json({ error: "Failed to capture PayPal order" });
  }
});
`;

// Updated PayPal client component with proper error handling
const paypalComponentFix = `
import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuoteContext } from "@/contexts/QuoteContext";
import { useToast } from "@/hooks/use-toast";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "paypal-button": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}

export default function PayPalCheckout() {
  const { toast } = useToast();
  const { quote } = useContext(QuoteContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Make sure we have the quote data
    if (!quote || !quote.finalPrice) {
      setError("No quote data found. Please go back and create a quote first.");
      return;
    }

    console.log("Quote data loaded for PayPal:", quote);
    loadPayPalSDK();
  }, [quote]);

  const loadPayPalSDK = async () => {
    try {
      setLoading(true);
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
      setError("Failed to load PayPal. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async () => {
    try {
      if (!quote || !quote.finalPrice) {
        throw new Error("Quote data is missing");
      }

      const orderPayload = {
        amount: quote.finalPrice.toString(),
        currency: "GBP",
        intent: "CAPTURE",
      };

      const response = await fetch("/api/paypal/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create order");
      }

      const output = await response.json();
      return { orderId: output.id };
    } catch (err) {
      console.error("Order creation error:", err);
      setError(err.message || "Failed to create order");
      throw err;
    }
  };

  const captureOrder = async (orderId: string) => {
    try {
      const response = await fetch(\`/api/paypal/order/\${orderId}/capture\`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to capture order");
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error("Order capture error:", err);
      throw err;
    }
  };

  const onApprove = async (data: any) => {
    try {
      setLoading(true);
      console.log("Payment approved:", data);
      const orderData = await captureOrder(data.orderId);
      console.log("Capture result:", orderData);

      // Show success message
      toast({
        title: "Payment Successful",
        description: "Your booking has been confirmed!",
      });

      // Redirect to confirmation page
      navigate("/booking-confirmation");
    } catch (err) {
      console.error("Payment completion error:", err);
      setError("Failed to complete payment. Please try again.");
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onCancel = () => {
    console.log("Payment cancelled by user");
    toast({
      title: "Payment Cancelled",
      description: "You cancelled the payment process.",
    });
  };

  const onError = (err: any) => {
    console.error("PayPal error:", err);
    setError("PayPal encountered an error. Please try again.");
    toast({
      title: "PayPal Error",
      description: "There was a problem with PayPal. Please try again later.",
      variant: "destructive",
    });
  };

  const initPayPal = async () => {
    try {
      const clientToken: string = await fetch("/api/paypal/setup")
        .then((res) => {
          if (!res.ok) throw new Error("Failed to get PayPal setup");
          return res.json();
        })
        .then((data) => {
          if (!data.clientToken) throw new Error("Invalid PayPal setup response");
          return data.clientToken;
        });

      const sdkInstance = await (window as any).paypal.createInstance({
        clientToken,
        components: ["paypal-payments"],
      });

      const paypalCheckout = sdkInstance.createPayPalOneTimePaymentSession({
        onApprove,
        onCancel,
        onError,
      });

      const onClick = async () => {
        try {
          setLoading(true);
          setError("");
          const checkoutOptionsPromise = createOrder();
          await paypalCheckout.start(
            { paymentFlow: "auto" },
            checkoutOptionsPromise
          );
        } catch (e) {
          console.error("PayPal start error:", e);
          setError("Failed to start PayPal checkout. Please try again.");
        } finally {
          setLoading(false);
        }
      };

      const paypalButton = document.getElementById("paypal-button");

      if (paypalButton) {
        paypalButton.addEventListener("click", onClick);
      }

      return () => {
        if (paypalButton) {
          paypalButton.removeEventListener("click", onClick);
        }
      };
    } catch (e) {
      console.error("PayPal initialization error:", e);
      setError("Failed to initialize PayPal. Please try again later.");
    }
  };

  // Format price for display
  function formatPrice(price: number): string {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(price);
  }

  if (!quote || !quote.finalPrice) {
    return (
      <div className="container mx-auto py-10">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-4">PayPal Checkout</h1>
          <p className="text-red-500 mb-4">
            No quote data found. Please go back and create a quote first.
          </p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Complete Your Booking with PayPal</h1>

        <div className="mb-6 space-y-4">
          <div className="flex justify-between py-2 border-b">
            <span className="font-medium">From:</span>
            <span>{quote.pickupAddress}</span>
          </div>

          <div className="flex justify-between py-2 border-b">
            <span className="font-medium">To:</span>
            <span>{quote.deliveryAddress}</span>
          </div>

          <div className="flex justify-between py-2 border-b">
            <span className="font-medium">Distance:</span>
            <span>{quote.distance} miles</span>
          </div>

          <div className="flex justify-between py-2 border-b">
            <span className="font-medium">Van Size:</span>
            <span className="capitalize">{quote.vanSize}</span>
          </div>

          <div className="flex justify-between py-2 border-b">
            <span className="font-medium">Move Date:</span>
            <span>{new Date(quote.moveDate).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-md mb-6">
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total Price:</span>
            <span>{formatPrice(quote.finalPrice)}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Price includes VAT, fuel, and all other charges
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="mt-6">
          <Button
            id="paypal-button"
            disabled={loading}
            className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white py-3 rounded-md flex items-center justify-center space-x-2"
          >
            {loading ? (
              "Processing..."
            ) : (
              <>
                <span>Pay with</span>
                <span className="font-bold">PayPal</span>
              </>
            )}
          </Button>
        </div>

        <p className="text-sm text-center mt-4 text-gray-500">
          You'll be redirected to PayPal to complete your payment securely
        </p>
      </Card>
    </div>
  );
}
`;

// ====================================================
// 3. QUOTE VALIDATION AND STATE PERSISTENCE
// ====================================================

/**
 * Fix issues with quote data being lost during the payment process
 */

const quoteStateFix = `
import { createContext, useState, useEffect, ReactNode } from 'react';

// Define the quote type
export interface Quote {
  totalPrice: number;
  originalPrice: number;
  finalPrice: number;
  totalWithVAT: number;
  subTotal: number;
  currency: string;
  priceString: string;
  estimatedTime: string;
  explanation: string;
  pickupAddress: string;
  deliveryAddress: string;
  distance: number;
  vanSize: string;
  moveDate: string;
  distanceCharge: number;
  timeCharge: number;
  helpersFee: number;
  floorAccessFee: number;
  peakTimeSurcharge: number;
  urgencySurcharge: number;
  fuelCost: number;
  returnJourneyCost: number;
  congestionCharge: number;
  platformFee: number;
  driverShare: number;
  includesVAT: boolean;
  vatAmount: number;
  netAmount: number;
  breakdown: string[];
}

// Define the context value type
interface QuoteContextValue {
  quote: Quote | null;
  setQuote: (quote: Quote) => void;
  clearQuote: () => void;
}

// Create the context with a default value
export const QuoteContext = createContext<QuoteContextValue>({
  quote: null,
  setQuote: () => {},
  clearQuote: () => {},
});

// Create the provider component
export const QuoteProvider = ({ children }: { children: ReactNode }) => {
  const [quote, setQuoteState] = useState<Quote | null>(null);

  // Load quote from localStorage on initial mount
  useEffect(() => {
    try {
      const savedQuote = localStorage.getItem('easyMoveQuote');
      if (savedQuote) {
        const parsedQuote = JSON.parse(savedQuote);
        if (parsedQuote && parsedQuote.finalPrice) {
          console.log('Quote loaded from localStorage:', parsedQuote);
          setQuoteState(parsedQuote);
        }
      }
    } catch (error) {
      console.error('Error loading quote from localStorage:', error);
    }
  }, []);

  // Save quote to localStorage whenever it changes
  const setQuote = (newQuote: Quote) => {
    try {
      // Validate quote data before saving
      if (!newQuote || !newQuote.finalPrice) {
        console.error('Invalid quote data:', newQuote);
        return;
      }
      
      // Make sure all required fields are present
      const requiredFields = [
        'finalPrice', 'totalWithVAT', 'pickupAddress', 
        'deliveryAddress', 'distance', 'vanSize'
      ];
      
      for (const field of requiredFields) {
        if (newQuote[field] === undefined) {
          console.error(`Quote missing required field: ${field}`);
          return;
        }
      }
      
      setQuoteState(newQuote);
      localStorage.setItem('easyMoveQuote', JSON.stringify(newQuote));
      console.log('Quote saved to localStorage:', newQuote);
    } catch (error) {
      console.error('Error saving quote to localStorage:', error);
    }
  };

  // Clear quote from state and localStorage
  const clearQuote = () => {
    setQuoteState(null);
    localStorage.removeItem('easyMoveQuote');
  };

  return (
    <QuoteContext.Provider value={{ quote, setQuote, clearQuote }}>
      {children}
    </QuoteContext.Provider>
  );
};

// Use the QuoteProvider at the app root:
// <QuoteProvider>
//   <App />
// </QuoteProvider>
`;

// ====================================================
// 4. ENVIRONMENT VARIABLE VALIDATION
// ====================================================

/**
 * Make sure all required environment variables are present and validated
 */

const environmentValidation = `
// Add this to server/index.ts to validate environment variables on startup

function validateEnvironment() {
  const warnings = [];
  const errors = [];
  
  // Check for required API keys
  if (!process.env.STRIPE_SECRET_KEY) {
    errors.push('Missing STRIPE_SECRET_KEY');
  } else if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
    errors.push('Invalid STRIPE_SECRET_KEY format (must start with sk_)');
  }
  
  if (!process.env.VITE_STRIPE_PUBLIC_KEY) {
    errors.push('Missing VITE_STRIPE_PUBLIC_KEY');
  } else if (!process.env.VITE_STRIPE_PUBLIC_KEY.startsWith('pk_')) {
    errors.push('Invalid VITE_STRIPE_PUBLIC_KEY format (must start with pk_)');
  }
  
  if (!process.env.PAYPAL_CLIENT_ID) {
    errors.push('Missing PAYPAL_CLIENT_ID');
  }
  
  if (!process.env.PAYPAL_CLIENT_SECRET) {
    errors.push('Missing PAYPAL_CLIENT_SECRET');
  }
  
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    warnings.push('Missing GOOGLE_MAPS_API_KEY - distance calculation will use fallback method');
  }
  
  if (!process.env.DATABASE_URL) {
    errors.push('Missing DATABASE_URL - database functionality will not work');
  }
  
  // Check for potential key swap issues
  if (
    process.env.STRIPE_SECRET_KEY && 
    process.env.VITE_STRIPE_PUBLIC_KEY &&
    process.env.STRIPE_SECRET_KEY.startsWith('pk_') && 
    process.env.VITE_STRIPE_PUBLIC_KEY.startsWith('sk_')
  ) {
    errors.push('Stripe keys are swapped! STRIPE_SECRET_KEY and VITE_STRIPE_PUBLIC_KEY values need to be swapped.');
  }
  
  // Log errors and warnings
  if (warnings.length > 0) {
    console.warn('=== ENVIRONMENT WARNINGS ===');
    warnings.forEach(warning => console.warn(warning));
    console.warn('=============================');
  }
  
  if (errors.length > 0) {
    console.error('=== ENVIRONMENT ERRORS ===');
    errors.forEach(error => console.error(error));
    console.error('===========================');
    
    // Return false if there are critical errors
    return false;
  }
  
  console.log('Environment variables validation passed.');
  return true;
}

// Call this function on app startup
validateEnvironment();
`;

// ====================================================
// 5. API ROUTE VALIDATION
// ====================================================

/**
 * Make sure all API routes are properly defined and working
 */

const apiRouteValidation = `
// Add this to server/routes.ts to validate API routes

function validateAPIRoutes(app) {
  // Define all API endpoints that should exist
  const requiredEndpoints = [
    { method: 'POST', path: '/api/quotes/calculate' },
    { method: 'POST', path: '/api/create-payment-intent' },
    { method: 'GET', path: '/api/paypal/setup' },
    { method: 'POST', path: '/api/paypal/order' },
    { method: 'POST', path: '/api/paypal/order/:orderID/capture' },
    { method: 'GET', path: '/api/images/van/:size' },
    { method: 'GET', path: '/api/distance' },
  ];
  
  // Log registered routes
  console.log('Validating API routes...');
  
  // Check if Express app has routes matching our requirements
  const registeredRoutes = app._router.stack
    .filter(layer => layer.route)
    .map(layer => ({
      method: Object.keys(layer.route.methods)[0].toUpperCase(),
      path: layer.route.path
    }));
  
  // Log all registered routes for debugging
  console.log('Registered API routes:');
  registeredRoutes.forEach(route => {
    console.log(\`\${route.method} \${route.path}\`);
  });
  
  // Check for missing routes
  const missingRoutes = requiredEndpoints.filter(required => {
    return !registeredRoutes.some(route => 
      route.method === required.method && 
      (route.path === required.path || 
       (required.path.includes(':') && 
        route.path.split('/').length === required.path.split('/').length))
    );
  });
  
  if (missingRoutes.length > 0) {
    console.warn('Missing API routes:');
    missingRoutes.forEach(route => {
      console.warn(\`\${route.method} \${route.path}\`);
    });
    console.warn('These routes need to be implemented for the app to function correctly.');
  } else {
    console.log('All required API routes are properly defined.');
  }
}
`;

// ====================================================
// HOW TO IMPLEMENT THESE FIXES
// ====================================================

/**
 * Steps to implement these payment fixes:
 * 
 * 1. Replace the Stripe implementation in server/routes.ts with the fixed version
 * 2. Update the client-side StripeCheckout.tsx component
 * 3. Make sure all PayPal routes are correctly defined in server/routes.ts
 * 4. Update the PayPalCheckout component for better error handling
 * 5. Improve QuoteContext to persist quote data properly
 * 6. Add environment variable validation on app startup
 * 7. Validate all API routes to ensure they're properly defined
 * 
 * After implementing these changes, test the payment flow to ensure:
 * - Quote data is preserved throughout the checkout process
 * - Stripe payment intent creation works correctly
 * - PayPal checkout flow works end-to-end
 * - Proper error handling is in place for both payment methods
 */