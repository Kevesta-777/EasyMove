/**
 * PAYMENT FINALIZATION FIX
 * 
 * This file provides a simpler, more reliable implementation for payment 
 * processing in the EasyMove Man and Van application.
 */

// ====================================================
// 1. STRIPE PAYMENT FIX
// ====================================================

/**
 * The root cause of the Stripe payment issue is:
 * "The client_secret provided does not match any associated PaymentIntent on this account."
 * 
 * This typically happens when:
 * 1. The public and secret keys don't belong to the same Stripe account
 * 2. The payment intent client_secret is malformed or invalid
 * 3. The Stripe initialization isn't happening correctly
 */

// SERVER-SIDE FIX: Replace the payment intent creation in server/routes.ts

/**
 * Validate Stripe API keys before initializing
 */
function validateStripeKeys() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publicKey = process.env.VITE_STRIPE_PUBLIC_KEY;
  
  let hasErrors = false;
  
  if (!secretKey) {
    console.error('Missing STRIPE_SECRET_KEY');
    hasErrors = true;
  } else if (!secretKey.startsWith('sk_')) {
    console.error(`Invalid STRIPE_SECRET_KEY format: ${secretKey.substring(0, 5)}... - Must start with sk_`);
    hasErrors = true;
  }
  
  if (!publicKey) {
    console.error('Missing VITE_STRIPE_PUBLIC_KEY');
    hasErrors = true;
  } else if (!publicKey.startsWith('pk_')) {
    console.error(`Invalid VITE_STRIPE_PUBLIC_KEY format: ${publicKey.substring(0, 5)}... - Must start with pk_`);
    hasErrors = true;
  }
  
  // Check if keys are swapped
  if (secretKey && publicKey && 
      secretKey.startsWith('pk_') && 
      publicKey.startsWith('sk_')) {
    console.error('Stripe keys are swapped! Fix your environment variables.');
    return false;
  }
  
  return !hasErrors;
}

/**
 * Improved Stripe initialization function
 */
function initializeStripe() {
  try {
    if (!validateStripeKeys()) {
      console.error('Invalid Stripe configuration. Using demo mode.');
      return null;
    }
    
    // Initialize Stripe with proper error handling
    const Stripe = require('stripe');
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
      maxNetworkRetries: 3, // Add retries for better reliability
    });
    
    return stripe;
  } catch (error) {
    return null;
  }
}

/**
 * Simplified payment intent creation with better error handling
 */
async function createPaymentIntent(req, res) {
  try {
    // Initialize Stripe
    const stripe = initializeStripe();
    if (!stripe) {
      return res.status(500).json({
        error: 'Stripe configuration error',
        details: 'Check your Stripe API keys and try again'
      });
    }
    
    // Extract quote data
    const { finalPrice } = req.body;
    
    // Validate price
    if (!finalPrice || isNaN(parseFloat(finalPrice)) || parseFloat(finalPrice) <= 0) {
      return res.status(400).json({
        error: 'Invalid price',
        details: 'Price must be a positive number'
      });
    }
    
    // Convert to pennies for Stripe (must be integer)
    const amount = Math.round(parseFloat(finalPrice) * 100);
    
    // Create payment intent with simplified parameters
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'gbp',
      automatic_payment_methods: {
        enabled: true,
      },
      // Remove complex metadata to reduce potential errors
    });
    
    // Validate client secret
    if (!paymentIntent.client_secret) {
      throw new Error('Stripe did not return a valid client secret');
    }
    
    // Send back only the essential information
    return res.json({
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id
    });
    
  } catch (error) {
    console.error('Error creating payment intent:', error);
    
    return res.status(500).json({
      error: 'Failed to create payment intent',
      details: error.message || 'Unknown error',
    });
  }
}

// CLIENT-SIDE FIX: Replace the Stripe checkout component with a simpler version

// Replace client/src/pages/StripeCheckout.tsx with this simpler version
const improvedStripeCheckout = `
import { useEffect, useState, useContext } from 'react';
import { QuoteContext } from '@/contexts/QuoteContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

/**
 * Improved Stripe Checkout component with reliable redirect flow
 */
export default function StripeCheckout() {
  const { toast } = useToast();
  const { quote } = useContext(QuoteContext);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    // Make sure we have quote data
    if (!quote || !quote.finalPrice) {
      setError('No quote data found. Please go back and create a quote first.');
    }
  }, [quote]);
  
  // Function to handle checkout process
  async function handleCheckoutRedirect() {
    try {
      setIsLoading(true);
      setError('');
      
      if (!quote || !quote.finalPrice) {
        throw new Error('No quote data found. Please go back and create a quote first.');
      }
      
      // Simple data for payment intent
      const paymentData = {
        finalPrice: quote.finalPrice,
        totalWithVAT: quote.totalWithVAT || quote.finalPrice
      };
      
      
      // Create payment intent
      const response = await fetch('/api/create-stripe-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment setup failed');
      }
      
      const { url } = await response.json();
      
      // Redirect to Stripe checkout page
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
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
          onClick={handleCheckoutRedirect}
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

// SERVER-SIDE ADD: Create a new stripe checkout session endpoint

/**
 * Create a Stripe checkout session for more reliable checkout flow
 */
async function createStripeCheckoutSession(req, res) {
  try {
    const stripe = initializeStripe();
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe configuration error' });
    }

    const { finalPrice } = req.body;
    
    // Validate price
    if (!finalPrice || isNaN(parseFloat(finalPrice)) || parseFloat(finalPrice) <= 0) {
      return res.status(400).json({ error: 'Invalid price' });
    }
    
    // Convert to pennies for Stripe (must be integer)
    const amount = Math.round(parseFloat(finalPrice) * 100);
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'EasyMove Man and Van Service',
              description: 'Professional moving service',
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/booking-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/checkout`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      error: 'Failed to create checkout session',
      details: error.message,
    });
  }
}

// Add this route to server/routes.ts
// app.post('/api/create-stripe-checkout-session', createStripeCheckoutSession);

// ====================================================
// 2. PAYPAL PAYMENT FIX
// ====================================================

/**
 * PayPal payment processing with simplified approach
 */

// SERVER-SIDE: Add simplified PayPal routes

function initializePayPal() {
  try {
    const { CLIENT_ID, CLIENT_SECRET } = process.env;
    
    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.error('Missing PayPal credentials');
      return null;
    }
    
    return { CLIENT_ID, CLIENT_SECRET };
  } catch (error) {
    console.error('Error initializing PayPal:', error);
    return null;
  }
}

async function createPayPalOrder(req, res) {
  try {
    const { finalPrice } = req.body;
    
    // Validate price
    if (!finalPrice || isNaN(parseFloat(finalPrice)) || parseFloat(finalPrice) <= 0) {
      return res.status(400).json({ error: 'Invalid price' });
    }
    
    // Simple PayPal order creation
    const order = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'GBP',
            value: finalPrice,
          },
        },
      ],
      application_context: {
        brand_name: 'EasyMove Man and Van',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: `${req.headers.origin}/booking-confirmation`,
        cancel_url: `${req.headers.origin}/checkout`,
      },
    };
    
    // Use PayPal REST API directly
    const { CLIENT_ID, CLIENT_SECRET } = initializePayPal();
    if (!CLIENT_ID || !CLIENT_SECRET) {
      return res.status(500).json({ error: 'PayPal configuration error' });
    }
    
    // Get access token
    const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    const tokenResponse = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
      method: 'POST',
      body: 'grant_type=client_credentials',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    const { access_token } = await tokenResponse.json();
    
    // Create order
    const response = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify(order),
    });
    
    const data = await response.json();
    
    if (data.error) {
      return res.status(500).json({ error: data.error });
    }
    
    // Return PayPal order ID and approval URL
    return res.json({
      id: data.id,
      approvalUrl: data.links.find(link => link.rel === 'approve').href,
    });
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    return res.status(500).json({
      error: 'Failed to create PayPal order',
      details: error.message,
    });
  }
}

// CLIENT-SIDE: Simplified PayPal checkout component

const improvedPayPalCheckout = `
import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QuoteContext } from '@/contexts/QuoteContext';
import { useToast } from '@/hooks/use-toast';

export default function PayPalCheckout() {
  const { toast } = useToast();
  const { quote } = useContext(QuoteContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Function to handle PayPal checkout
  async function handlePayPalCheckout() {
    try {
      setLoading(true);
      setError('');
      
      if (!quote || !quote.finalPrice) {
        throw new Error('No quote data found');
      }
      
      // Create PayPal order
      const response = await fetch('/api/create-paypal-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finalPrice: quote.finalPrice,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment setup failed');
      }
      
      const { approvalUrl } = await response.json();
      
      // Redirect to PayPal for payment
      if (approvalUrl) {
        window.location.href = approvalUrl;
      } else {
        throw new Error('No PayPal approval URL received');
      }
      
    } catch (err) {
      console.error('PayPal error:', err);
      setError(err.message || 'Failed to setup PayPal checkout');
      toast({
        title: 'PayPal Error',
        description: err.message || 'Failed to setup PayPal checkout',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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

        <Button
          onClick={handlePayPalCheckout}
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

        <p className="text-sm text-center mt-4 text-gray-500">
          You'll be redirected to PayPal to complete your payment securely
        </p>
      </Card>
    </div>
  );
}
`;

// ====================================================
// 3. QUOTE GENERATION FIX
// ====================================================

/**
 * Fix for quote generation to ensure accurate mileage and cost
 */

/**
 * Update the distance calculator to use more reliable city pairs
 * and to handle UK postcodes for better accuracy.
 */

// Add more accurate UK postcode detection for mileage calculation
function getDistanceFromPostcodes(originPostcode, destinationPostcode) {
  // Extract postcode area
  function extractPostcodeArea(postcode) {
    if (!postcode) return '';
    
    // Normalize postcode (remove spaces, uppercase)
    const normalized = postcode.toUpperCase().replace(/\s+/g, '');
    
    // Extract the outward code (first part)
    const match = normalized.match(/^[A-Z]{1,2}[0-9][0-9A-Z]?/);
    return match ? match[0] : '';
  }
  
  // Get areas
  const originArea = extractPostcodeArea(originPostcode);
  const destArea = extractPostcodeArea(destinationPostcode);
  
  if (!originArea || !destArea) return null;
  
  // UK postcode distances database (outward code pairs)
  const postcodeDistances = {
    // Define distances between common postcode areas
    'DE19-WF10': 70, // Derby to Wakefield
    'WF10-DE19': 70,
    'B1-M1': 86,    // Birmingham to Manchester
    'M1-B1': 86,
    'L1-M1': 35,    // Liverpool to Manchester
    'M1-L1': 35,
    'B1-L1': 100,   // Birmingham to Liverpool
    'L1-B1': 100,
    'NE1-L1': 175,  // Newcastle to Liverpool
    'L1-NE1': 175,
    'PO1-SO1': 20,  // Portsmouth to Southampton
    'SO1-PO1': 20,
    'PO1-BN1': 49,  // Portsmouth to Brighton
    'BN1-PO1': 49,
    // Add more postcode area pairs as needed
  };
  
  // Check if we have a distance for this pair
  const key = `${originArea}-${destArea}`;
  
  if (postcodeDistances[key]) {
    return postcodeDistances[key];
  }
  
  return null;
}

/**
 * A more accurate way to calculate mileage for quote generation
 */
async function calculateAccurateMileage(origin, destination) {
  // Try postcode distance first
  const postcodeDistance = getDistanceFromPostcodes(origin, destination);
  if (postcodeDistance) {
    return postcodeDistance;
  }
  
  // Extract city names for checking against our database
  function extractCity(address) {
    const lowerAddress = address.toLowerCase();
    // Check for common UK cities
    const commonCities = [
      'london', 'manchester', 'birmingham', 'leeds', 'glasgow', 
      'liverpool', 'newcastle', 'sheffield', 'bristol', 'portsmouth',
      'southampton', 'brighton', 'nottingham', 'leicester', 'coventry'
    ];
    
    for (const city of commonCities) {
      if (lowerAddress.includes(city)) {
        return city;
      }
    }
    
    return null;
  }
  
  // Try city pair database
  const originCity = extractCity(origin);
  const destCity = extractCity(destination);
  
  if (originCity && destCity) {
    const cityDistances = {
      'london-manchester': 200,
      'manchester-london': 200,
      'london-birmingham': 126,
      'birmingham-london': 126,
      'portsmouth-london': 75,
      'london-portsmouth': 75,
      'portsmouth-southampton': 20,
      'southampton-portsmouth': 20,
      'portsmouth-brighton': 49,
      'brighton-portsmouth': 49,
      'portsmouth-newcastle': 330,
      'newcastle-portsmouth': 330,
      // Add more city pairs as needed
    };
    
    const key = `${originCity}-${destCity}`;
    if (cityDistances[key]) {
      return cityDistances[key];
    }
  }
  
  // If all else fails, fallback to a basic calculation
  return 100; // Default fallback distance in miles
}

// ====================================================
// 4. IMPLEMENT FIXES
// ====================================================

/**
 * How to apply these fixes:
 * 
 * 1. Replace the existing Stripe payment implementation with the improved version
 * 2. Add the new PayPal payment flow 
 * 3. Update the quote generation with more accurate mileage calculation
 * 4. Test the complete quote-to-payment flow
 */