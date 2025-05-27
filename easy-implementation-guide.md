# EasyMove Quick Fix Implementation Guide

## Overview of Issues

1. **Payment Finalization Error**: "The client_secret provided does not match any associated PaymentIntent"
2. **Quote Generation**: Inaccurate mileage calculation impacting pricing
3. **API Dependencies**: Reliance on external APIs that may fail (Google Maps)

## Quick Fix Implementation

### Step 1: Fix the Payment Process

The simplest and most immediate solution is to replace the embedded payment elements with redirect flows, which are much more reliable:

1. **Add the Stripe Checkout Session endpoint** to `server/routes.ts`:

```javascript
// Add at the top of the file
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Add this endpoint in the routes
app.post('/api/create-stripe-checkout-session', async (req, res) => {
  try {
    const { finalPrice } = req.body;
    
    // Validate price
    if (!finalPrice || isNaN(parseFloat(finalPrice))) {
      return res.status(400).json({ error: 'Invalid price' });
    }
    
    // Convert to pennies for Stripe
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
});
```

2. **Replace the Stripe Checkout component** in `client/src/pages/StripeCheckout.tsx`:

```jsx
import { useEffect, useState, useContext } from 'react';
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
    if (!quote || !quote.finalPrice) {
      setError('No quote data found. Please go back and create a quote first.');
    }
  }, [quote]);
  
  async function handleCheckout() {
    try {
      setIsLoading(true);
      setError('');
      
      if (!quote || !quote.finalPrice) {
        throw new Error('No quote data found. Please go back and create a quote first.');
      }
      
      const response = await fetch('/api/create-stripe-checkout-session', {
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
```

### Step 2: Fix Distance Calculation

1. **Add the UK city pair distances database** to `server/services/distance-calculator.ts`:

```javascript
// Add this constant near the top of the file
const EXACT_DISTANCES = {
  "london-manchester": 200,
  "manchester-london": 200,
  "london-birmingham": 126,
  "birmingham-london": 126,
  "london-leeds": 196,
  "leeds-london": 196,
  "london-liverpool": 219,
  "liverpool-london": 219,
  "london-bristol": 118,
  "bristol-london": 118,
  "london-newcastle": 283,
  "newcastle-london": 283,
  "london-edinburgh": 403,
  "edinburgh-london": 403,
  "london-glasgow": 412,
  "glasgow-london": 412,
  "manchester-liverpool": 35,
  "liverpool-manchester": 35,
  "manchester-leeds": 44,
  "leeds-manchester": 44,
  "manchester-birmingham": 86,
  "birmingham-manchester": 86,
  "birmingham-bristol": 88,
  "bristol-birmingham": 88,
  "leeds-newcastle": 94,
  "newcastle-leeds": 94,
  "edinburgh-glasgow": 47,
  "glasgow-edinburgh": 47,
  "portsmouth-london": 75,
  "london-portsmouth": 75,
  "portsmouth-southampton": 20,
  "southampton-portsmouth": 20,
  "portsmouth-brighton": 49,
  "brighton-portsmouth": 49,
  "portsmouth-bristol": 97,
  "bristol-portsmouth": 97,
  "portsmouth-oxford": 65,
  "oxford-portsmouth": 65,
  "portsmouth-cardiff": 130,
  "cardiff-portsmouth": 130,
  "portsmouth-manchester": 235,
  "manchester-portsmouth": 235,
  "portsmouth-birmingham": 152,
  "birmingham-portsmouth": 152,
  "portsmouth-leeds": 252,
  "leeds-portsmouth": 252,
  "portsmouth-newcastle": 330,
  "newcastle-portsmouth": 330
};

// Add this helper function to extract city names
function extractCity(address) {
  if (!address) return "";
  
  const lowerAddress = address.toLowerCase();
  
  for (const city of Object.keys(UK_CITY_COORDINATES)) {
    if (lowerAddress.includes(city)) {
      return city;
    }
  }
  
  return "";
}
```

2. **Modify the `calculateDistance` function** to use the exact distances database first:

```javascript
export async function calculateDistance(
  originAddress: string,
  destinationAddress: string
): Promise<DistanceResponse> {
  console.log(`Calculating distance from ${originAddress} to ${destinationAddress}`);
  
  try {
    // Try pre-computed exact distances first
    const originCity = extractCity(originAddress);
    const destCity = extractCity(destinationAddress);
    
    if (originCity && destCity) {
      const cityPair = `${originCity}-${destCity}`;
      
      if (EXACT_DISTANCES[cityPair]) {
        const exactDistance = EXACT_DISTANCES[cityPair];
        const estimatedTime = calculateEstimatedTime(exactDistance);
        
        console.log(`Using exact distance for ${originCity} to ${destCity}: ${exactDistance} miles`);
        
        return {
          distance: exactDistance,
          unit: "miles",
          estimatedTime,
          origin: originAddress,
          destination: destinationAddress,
          route: `${originCity} to ${destCity}`,
          usingGoogleMaps: false,
          exactCalculation: true
        };
      }
    }
    
    // Continue with existing fallback logic...
    // (Rest of the function remains unchanged)
  } catch (error) {
    // Error handling remains the same
  }
}
```

### Step 3: Fix VAT Calculation in Price Breakdown

Update the VAT calculation in `shared/pricing-rules.ts`:

```javascript
// Fix the VAT calculation
export function calculateVAT(price: number): number {
  // Always calculate 20% VAT consistently
  return Math.round((price * 0.20) * 100) / 100;
}

export function calculatePriceWithVAT(price: number): number {
  // Add 20% VAT
  return Math.round((price * 1.20) * 100) / 100;
}
```

## Testing the Fixes

1. Test the quote generation with common city pairs (e.g., "London to Manchester", "Portsmouth to Newcastle")
2. Test the checkout flow by proceeding to payment (you should be redirected to Stripe's hosted checkout)
3. Verify that the price shown on the checkout matches the quoted price

## Important Notes:

- The redirect-based payment flows are more reliable than embedded payment elements
- The city pair database ensures accurate distances even when the Google Maps API fails
- The payment flow should now work seamlessly even with API key issues

These fixes address the immediate payment processing errors while providing a more reliable distance calculation system.