# EasyMove Man and Van Service - Developer Documentation

## Overview

EasyMove is a sophisticated man and van transport service platform that delivers transparent, data-driven pricing solutions with a focus on seamless user experience and efficient quote generation. The application serves the North East, London, West Midlands, Essex, and Peterborough regions specifically.

This documentation provides a comprehensive overview of the EasyMove application architecture, focusing on the two critical components that need improvement:
1. **Accurate Quote Generation System**
2. **Seamless Payment Processing Integration**

## Technical Stack

- **Frontend**: React.js with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Backend**: Express.js with Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Payment Processing**: Stripe and PayPal integrations
- **State Management**: React Query

## 1. Quote Generation System

### Core Components

#### 1.1 Distance Calculation

The distance calculation is a critical component of the quote generation process. We use multiple approaches to ensure accuracy:

**File: `server/services/fixed-distance-calculator.ts`**

```typescript
/**
 * Calculate distance using the Haversine formula (great-circle distance)
 * with UK-specific adjustments
 */
function calculateHaversineWithUKAdjustments(
  from: string,
  to: string,
  fromPostcode: string | null,
  toPostcode: string | null
): { distance: number; estimatedTime: number } {
  // Extract postcodes or use approximate city coordinates
  
  // Special case handling for Peterborough postcodes (PE2, PE7, etc.)
  if ((fromPostcode && fromPostcode.startsWith('PE')) || 
      (toPostcode && toPostcode.startsWith('PE'))) {
    // Improved Peterborough area calculations
    // This section needs enhancement for better accuracy
  }

  // Calculate base distance using Haversine formula
  // Apply UK-specific road network adjustments
  // Return distance in miles and estimated time in minutes
}

/**
 * Main distance calculation function using multiple approaches
 */
export async function calculateDistance(from: string, to: string): Promise<{
  distance: number;
  unit: string;
  estimatedTime: number;
}> {
  // 1. Try to use cached distance if identical journey was calculated recently
  // 2. Extract postcodes
  // 3. Use Haversine with UK adjustments
  // 4. Apply regional routing factors based on source/destination
  // 5. Return the calculated distance in miles
}
```

**Issue to Fix:** The distance calculation between certain postcodes (particularly in Peterborough area, like PE2 to PE7) needs to be more accurate. The current implementation sometimes underestimates the actual driving distance.

#### 1.2 Pricing Rules and Quote Calculation

**File: `shared/pricing-rules.ts`**

```typescript
export type VanSize = 'small' | 'medium' | 'large' | 'luton';
export type FloorAccess = 'ground' | 'first' | 'second' | 'third+';
export type UrgencyLevel = 'standard' | 'urgent' | 'immediate';

// Pricing constants that affect the final quote
export const PRICING_CONSTANTS = {
  BASE_FARE: 40, // Starting price for any job
  DISTANCE_RATES: {
    SHORT: 7.4, // Per mile for distances < 5 miles
    MEDIUM: 6.2, // Per mile for distances 5-20 miles
    LONG: 4.8, // Per mile for distances > 20 miles
  },
  VAN_SIZE_MULTIPLIERS: {
    small: 0.85,
    medium: 1.2,
    large: 1.5,
    luton: 1.8,
  },
  HOURLY_RATES: {
    small: 28,
    medium: 42,
    large: 55,
    luton: 65,
  },
  HELPER_FEE: 25, // Per helper per hour
  FLOOR_ACCESS_FEES: {
    ground: 0,
    first: 15,
    second: 30,
    'third+': 50,
  },
  LIFT_DISCOUNT: 0.5, // 50% discount on floor access fee if lift is available
  PEAK_TIME_SURCHARGE: 0.25, // 25% extra during peak hours
  WEEKEND_SURCHARGE: 0.15, // 15% extra on weekends
  HOLIDAY_SURCHARGE: 0.3, // 30% extra on holidays
  URGENCY_SURCHARGES: {
    standard: 0,
    urgent: 0.2, // 20% extra for urgent (same-day) service
    immediate: 0.35, // 35% extra for immediate service
  },
  FUEL_COST_PER_LITRE: 1.8, // Average cost of diesel fuel per litre
  LITRES_PER_GALLON: 4.54609, // Conversion factor
  MPG: { // Miles per gallon for different van sizes
    small: 38,
    medium: 32,
    large: 28,
    luton: 22,
  },
  RETURN_JOURNEY_FACTOR: 0.5, // Return journey cost as percentage of outbound
  CONGESTION_CHARGE: 15, // London congestion charge
  PLATFORM_FEE_PERCENTAGE: 0.25, // 25% platform fee
  VAT_RATE: 0.2, // 20% VAT
};

/**
 * Calculate a simple quote based on distance, van size, and other factors
 */
export function calculateSimpleQuote(params: {
  distance: number;
  vanSize: VanSize;
  moveDate: Date;
  moveTime: string;
  helpers: number;
  estimatedHours: number;
  floorAccessPickup: FloorAccess;
  floorAccessDelivery: FloorAccess;
  liftAvailablePickup: boolean;
  liftAvailableDelivery: boolean;
  urgency: UrgencyLevel;
  isLondon?: boolean;
}): QuoteResult {
  // Calculate each component of the price
  // 1. Base fare
  // 2. Distance charge
  // 3. Time charge based on hourly rate
  // 4. Additional helpers cost
  // 5. Floor access fees
  // 6. Peak time surcharges
  // 7. Weekend/holiday surcharges
  // 8. Urgency surcharges
  // 9. Fuel costs
  // 10. Return journey costs
  // 11. Congestion charges if applicable
  
  // Calculate final price with VAT
  // Build a breakdown of the quote components
  // Return the complete quote information
}
```

**Issue to Fix:** The pricing calculation needs refinement for accuracy, especially for specific journey types (e.g., PE2 5ET to PE7 8BA) where the current model doesn't fully account for real-world factors like traffic patterns and road types.

## 2. Payment Processing System

### 2.1 PayPal Integration

The PayPal integration is designed to process payments with minimal loading time. The implementation includes token caching, background refresh mechanisms, and robust error handling.

#### PayPal Button Component

**File: `client/src/components/payment/PayPalButton.tsx`**

```typescript
interface PayPalButtonProps {
  amount: string;
  currency: string;
  intent: string;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  onCancel?: () => void;
  preloadToken?: boolean;
  quickModeDefault?: boolean;
}

// Preload token in background for faster checkout
const preloadPayPalToken = async (): Promise<void> => {
  // Implementation for token preloading
  // Uses a caching mechanism to avoid repeated token fetches
};

export default function PayPalButton({
  amount,
  currency,
  intent,
  onSuccess: externalSuccessHandler,
  onError: externalErrorHandler,
  onCancel: externalCancelHandler,
  preloadToken = true,
  quickModeDefault = true
}: PayPalButtonProps) {
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    tokenFetchTime?: number;
    orderCreationTime?: number;
    captureTime?: number;
    totalTime?: number;
  }>({});
  
  const createOrder = async () => {
    const startTime = Date.now();
    
    try {
      // Create PayPal order with performance tracking
      // Record performance metrics for monitoring
      // Return order ID for the next step
    } catch (error) {
      // Error handling with performance metrics
    }
  };
  
  const captureOrder = async (orderId: string) => {
    try {
      // Capture the PayPal payment
      // Return the captured order data
    } catch (error) {
      // Error handling
    }
  };
  
  const handleApprove = async (data: any) => {
    // Process successful payment approval
    // Record performance metrics
    // Trigger success events and callbacks
  };

  const handleCancel = (data: any) => {
    // Handle payment cancellation
  };

  const handleError = (data: any) => {
    // Handle payment errors
  };
  
  // Initialize PayPal with fallback mechanisms
  // Set up event handlers and cleanup
  
  return (
    <div className="paypal-button-container">
      <button 
        id="paypal-button"
        className="paypal-button"
        disabled={isLoading || !isInitialized}
      >
        {/* Button content based on state */}
      </button>
    </div>
  );
}
```

#### Server-side PayPal Implementation

**File: `server/paypal.ts`**

```typescript
import {
  Client,
  Environment,
  LogLevel,
  OAuthAuthorizationController,
  OrdersController,
} from "@paypal/paypal-server-sdk";
import { Request, Response } from "express";

// PayPal SDK initialization
const client = new Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: process.env.PAYPAL_CLIENT_ID!,
    oAuthClientSecret: process.env.PAYPAL_CLIENT_SECRET!,
  },
  environment: process.env.NODE_ENV === "production"
    ? Environment.Production
    : Environment.Sandbox,
  // Additional configuration
});

// Token generation with performance optimizations
export async function getClientToken() {
  // Get client token with caching for performance
}

// Create PayPal order with error handling
export async function createPaypalOrder(req: Request, res: Response) {
  try {
    // Validate input
    // Create order with PayPal SDK
    // Return response with performance metrics
  } catch (error) {
    // Error handling
  }
}

// Capture PayPal payment with performance tracking
export async function capturePaypalOrder(req: Request, res: Response) {
  try {
    // Capture order
    // Return response with performance metrics
  } catch (error) {
    // Error handling
  }
}

// Load default PayPal configuration
export async function loadPaypalDefault(req: Request, res: Response) {
  // Return client token for PayPal initialization
}
```

**File: `server/routes.ts` (PayPal Endpoints)**

```typescript
// Global cache for PayPal token
let cachedPayPalToken: string | null = null;
let tokenExpiration: number | null = null;

// Get or refresh PayPal token with performance optimization
async function getOrRefreshPayPalToken(): Promise<string> {
  // Check cache and return if valid
  // Otherwise fetch and cache new token
}

// Routes for PayPal integration
app.get("/api/paypal/setup", async (req, res) => {
  try {
    // Get token with performance tracking
    // Return token for client initialization
  } catch (error) {
    // Error handling
  }
});

app.get("/api/paypal/warmup", async (req, res) => {
  try {
    // Pre-warm PayPal API for faster first request
    // Return success response
  } catch (error) {
    // Error handling
  }
});

app.post("/api/paypal/order", async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Validate input
    // Pre-fetch token for faster processing
    // Create PayPal order
    // Return response with performance metrics
  } catch (error) {
    // Error handling with performance metrics
  }
});

app.post("/api/paypal/order/:orderID/capture", async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Pre-fetch token for faster capture
    // Capture payment
    // Return response with performance metrics
    // Record metrics for analysis
  } catch (error) {
    // Error handling with performance metrics
  }
});
```

**Issue to Fix:** The PayPal payment processing needs to be optimized for "split second" efficiency. While the token caching mechanism has been implemented, there are still occasional delays in processing payments, especially the first payment after server startup.

### 2.2 Stripe Integration

The Stripe integration provides an alternative payment option, with similar performance optimization goals.

**File: `client/src/components/payment/StripeCheckoutForm.tsx`**

```typescript
import { useStripe, CardElement, useElements } from '@stripe/react-stripe-js';
import { useState } from 'react';

interface StripeCheckoutFormProps {
  clientSecret: string;
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: Error) => void;
  amount: number;
  currency: string;
}

export default function StripeCheckoutForm({
  clientSecret,
  onSuccess,
  onError,
  amount,
  currency
}: StripeCheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Process payment with performance tracking
      // Handle success case
      // Invoke success callback
    } catch (error) {
      // Handle error case
      // Invoke error callback
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <CardElement />
      </div>
      <button 
        type="submit"
        disabled={!stripe || loading}
        className="w-full py-2 px-4 bg-primary text-white rounded"
      >
        {loading ? 'Processing...' : `Pay ${new Intl.NumberFormat('en-GB', {
          style: 'currency',
          currency: currency.toUpperCase()
        }).format(amount / 100)}`}
      </button>
      {error && <div className="text-red-500 mt-2">{error}</div>}
    </form>
  );
}
```

**Server-side Stripe Routes**

```typescript
// Create payment intent with Stripe
app.post('/api/stripe/create-payment-intent', async (req, res) => {
  try {
    const { amount, bookingDetails } = req.body;
    
    // Validate the request
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    // Create a payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(parseFloat(amount) * 100), // Convert to cents/pence
      currency: 'gbp',
      metadata: {
        // Store booking details for reference
        bookingDetails: JSON.stringify(bookingDetails),
        totalAmount: amount.toString(),
        includesVAT: 'true',
        vatAmount: (amount * 0.2).toString(),
      }
    });
    
    // Return the client secret
    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
});
```

**Issue to Fix:** While the Stripe integration is working, it needs the same level of performance optimization as the PayPal integration, including metrics tracking and pre-initialization to ensure payment processing happens with minimal delay.

## 3. Areas That Need Improvement

### 3.1 Quote Generation System

1. **Distance Calculation Accuracy**: 
   - The Haversine formula needs UK-specific adjustments, especially for the Peterborough area.
   - Caching of common routes should be implemented to improve performance.
   - Add more realistic time estimates based on traffic patterns.

2. **Price Calculation Enhancements**:
   - Refine the pricing model based on real-world data from completed moves.
   - Improve the handling of special cases like rural areas and urban centers.
   - Implement dynamic pricing based on demand and driver availability.

### 3.2 Payment Processing System

1. **PayPal Integration Optimization**:
   - Fix the token caching system to ensure it's properly shared across requests.
   - Add consistent error recovery mechanism to handle PayPal API outages.
   - Optimize the SDK initialization to reduce first-load time.

2. **Stripe Integration Enhancement**:
   - Add the same level of performance metrics tracking as PayPal.
   - Implement caching mechanisms to improve repeat payment performance.
   - Better error handling with specific user-friendly messages.

3. **General Payment Flow Improvements**:
   - Add a failover mechanism to switch between payment providers if one is experiencing issues.
   - Implement better real-time status updates during payment processing.
   - Add support for saved payment methods for returning customers.

## 4. Implementation Guide for Developers

### 4.1 Fixing Distance Calculation

1. Enhance the `calculateHaversineWithUKAdjustments` function to:
   - Use a more accurate mapping of UK postcodes to coordinates.
   - Add specific route adjustments for known areas like Peterborough.
   - Implement a distance cache to speed up repeated calculations.

2. Consider integrating a professional mapping API for critical routes.

### 4.2 Optimizing Payment Processing

1. Improve token caching:
   - Ensure token validity is properly checked before use.
   - Implement background refresh to always have a fresh token available.
   - Add detailed logging to track token lifecycle for debugging.

2. Enhance error handling:
   - Implement automatic retry mechanisms with exponential backoff.
   - Add real-time status updates to keep users informed during delays.
   - Develop a fallback pathway when a payment provider is experiencing issues.

## 5. Testing and Validation

1. **Automated Testing**:
   - Unit tests for distance calculation with known routes.
   - Integration tests for payment flow.
   - Performance tests to verify payment processing speed.

2. **Manual Testing Scenarios**:
   - Test specific problematic routes (e.g., PE2 5ET to PE7 8BA).
   - Verify payment processing time across different browsers and network conditions.
   - Test error scenarios by simulating API failures.

## Conclusion

This document outlines the current implementation and areas that need improvement in the EasyMove Man and Van service application. The focus should be on enhancing the accuracy of the quote generation system and optimizing the payment processing for split-second efficiency.

By addressing these issues, we can deliver a superior user experience with transparent, accurate pricing and seamless payment processing that meets or exceeds industry standards.