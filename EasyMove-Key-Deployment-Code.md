# EasyMove Man and Van Service - Key Code for Deployment

This document contains the key code components required for deploying the EasyMove application. It's a React/TypeScript web application (not React Native) with Node.js/Express backend and PostgreSQL database.

## Project Structure

```
EasyMove/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions
│   │   ├── contexts/       # React contexts
│   │   └── index.tsx       # Entry point
├── server/                 # Backend Express application
│   ├── routes.ts           # API routes
│   ├── paypal.ts           # PayPal integration
│   ├── db.ts               # Database connection
│   └── index.ts            # Server entry point
├── shared/                 # Shared between client and server
│   ├── schema.ts           # Database schema
│   └── pricing-rules.ts    # Business logic for pricing
└── package.json            # Dependencies and scripts
```

## Key Deployment Files

### 1. package.json (Root project configuration)

```json
{
  "name": "easymove-man-and-van",
  "version": "1.0.0",
  "description": "Professional man and van transport service with transparent pricing",
  "main": "server/index.ts",
  "scripts": {
    "dev": "node server/index.ts",
    "build": "tsc && vite build",
    "start": "node dist/server/index.js",
    "db:push": "drizzle-kit push"
  },
  "dependencies": {
    "@stripe/react-stripe-js": "^2.4.0",
    "@stripe/stripe-js": "^2.2.0",
    "@paypal/paypal-server-sdk": "^1.0.4",
    "drizzle-orm": "^0.28.6",
    "drizzle-zod": "^0.5.1",
    "express": "^4.18.2",
    "express-session": "^1.17.3", 
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zod": "^3.22.2",
    "wouter": "^2.12.0",
    "@tanstack/react-query": "^5.8.4"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 2. server/index.ts (Server entry point)

```typescript
import express from 'express';
import { registerRoutes } from './routes';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register API routes
(async () => {
  const server = await registerRoutes(app);
  
  // Start the server
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})();
```

### 3. server/routes.ts (API endpoints)

```typescript
import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import { storage } from "./storage";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Basic routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Payment routes
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount, bookingDetails } = req.body;
      
      console.log("🔔 Creating payment intent with data:", { amount, bookingDetails });
      
      // In production mode use real Stripe
      console.log("Using REAL Stripe implementation");
      console.log("Stripe public key configured:", process.env.VITE_STRIPE_PUBLIC_KEY?.substring(0, 10) + "...");
      
      // Convert to pence/cents (Stripe uses smallest currency unit)
      const roundedAmount = Math.round(amount);
      console.log("Rounded amount:", roundedAmount, "pounds");
      const stripeAmount = Math.round(roundedAmount * 100);
      console.log("Full amount for Stripe:", stripeAmount, "pennies (£" + roundedAmount + ")");
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: stripeAmount,
        currency: "gbp",
        payment_method_types: ["card"],
        metadata: {
          booking: JSON.stringify(bookingDetails)
        }
      });
      
      console.log("Payment intent created:", paymentIntent.id);
      console.log("Client secret format check:", paymentIntent.client_secret?.substring(0, 15) + "...");
      
      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error: any) {
      console.error("🔴 Error creating payment intent:", error.message);
      res.status(500).json({ 
        error: "Error creating payment intent",
        message: error.message
      });
    }
  });

  // PayPal routes
  app.get("/api/paypal/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post("/api/paypal/order", async (req, res) => {
    await createPaypalOrder(req, res);
  });

  app.post("/api/paypal/order/:orderID/capture", async (req, res) => {
    await capturePaypalOrder(req, res);
  });

  // Distance and quote calculation
  app.post("/api/quotes/calculate", async (req, res) => {
    try {
      const { from, to, vanSize, moveDate, floorAccess, helpers, itemDetails } = req.body;
      console.log('key=============', process.env.GOOGLE_MAPS_API_KEY);
      // Calculate distance between addresses
      const distanceResponse = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(from)}&destinations=${encodeURIComponent(to)}&key=${process.env.GOOGLE_MAPS_API_KEY}`
      );
      
      const distanceData = await distanceResponse.json();
      
      // Extract distance in miles and time
      const distanceInMeters = distanceData.rows[0].elements[0].distance.value;
      const distanceInMiles = distanceInMeters / 1609.34;
      
      // Use pricing rules to calculate quote
      const date = new Date(moveDate);
      const inLondon = from.toLowerCase().includes('london') || to.toLowerCase().includes('london');
      
      // Import the pricing functions
      const { buildPriceBreakdown, formatPrice } = await import('../shared/pricing-rules');
      
      // Calculate quote with detailed breakdown
      const breakdown = buildPriceBreakdown({
        distanceMiles: distanceInMiles,
        vanSize,
        estimatedHours: 2, // Base value, adjusted by additional factors
        numHelpers: helpers,
        floorAccess,
        liftAvailable: false,
        moveDate: date,
        urgency: "standard", 
        inLondon
      });
      
      // Return the formatted quote
      res.json({
        ...breakdown,
        distance: Math.round(distanceInMiles * 10) / 10,
        priceString: formatPrice(breakdown.totalWithVAT),
        netAmount: breakdown.totalPrice,
        includesVAT: true
      });
    } catch (error: any) {
      console.error('Error calculating quote:', error);
      res.status(500).json({ 
        error: 'Failed to calculate quote',
        message: error.message 
      });
    }
  });
  
  const httpServer = createServer(app);
  
  return httpServer;
}
```

### 4. server/paypal.ts (PayPal Integration)

```typescript
// CRITICAL - DO NOT MODIFY THIS PAYPAL INTEGRATION CODE
import {
  Client,
  Environment,
  LogLevel,
  OAuthAuthorizationController,
  OrdersController,
} from "@paypal/paypal-server-sdk";
import { Request, Response } from "express";

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;

if (!PAYPAL_CLIENT_ID) {
  throw new Error("Missing PAYPAL_CLIENT_ID");
}
if (!PAYPAL_CLIENT_SECRET) {
  throw new Error("Missing PAYPAL_CLIENT_SECRET");
}

const client = new Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: PAYPAL_CLIENT_ID,
    oAuthClientSecret: PAYPAL_CLIENT_SECRET,
  },
  timeout: 0,
  environment:
    process.env.NODE_ENV === "production"
      ? Environment.Production
      : Environment.Sandbox,
  logging: {
    logLevel: LogLevel.Info,
    logRequest: {
      logBody: true,
    },
    logResponse: {
      logHeaders: true,
    },
  },
});

const ordersController = new OrdersController(client);
const oAuthAuthorizationController = new OAuthAuthorizationController(client);

/* Token generation helpers */
export async function getClientToken() {
  const auth = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`,
  ).toString("base64");

  const { result } = await oAuthAuthorizationController.requestToken(
    {
      authorization: `Basic ${auth}`,
    },
    { intent: "sdk_init", response_type: "client_token" },
  );

  return result.accessToken;
}

/*  Process transactions */
export async function createPaypalOrder(req: Request, res: Response) {
  try {
    const { amount, currency, intent } = req.body;

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res
        .status(400)
        .json({
          error: "Invalid amount. Amount must be a positive number.",
        });
    }

    if (!currency) {
      return res
        .status(400)
        .json({ error: "Invalid currency. Currency is required." });
    }

    if (!intent) {
      return res
        .status(400)
        .json({ error: "Invalid intent. Intent is required." });
    }

    const collect = {
      body: {
        intent: intent,
        purchaseUnits: [
          {
            amount: {
              currencyCode: currency,
              value: amount,
            },
          },
        ],
      },
      prefer: "return=minimal",
    };

    const { body, ...httpResponse } =
      await ordersController.createOrder(collect);

    const jsonResponse = JSON.parse(String(body));
    const httpStatusCode = httpResponse.statusCode;

    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({ error: "Failed to create order." });
  }
}

export async function capturePaypalOrder(req: Request, res: Response) {
  try {
    const { orderID } = req.params;
    const collect = {
      id: orderID,
      prefer: "return=minimal",
    };

    const { body, ...httpResponse } =
      await ordersController.captureOrder(collect);

    const jsonResponse = JSON.parse(String(body));
    const httpStatusCode = httpResponse.statusCode;

    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({ error: "Failed to capture order." });
  }
}

export async function loadPaypalDefault(req: Request, res: Response) {
  const clientToken = await getClientToken();
  res.json({
    clientToken,
  });
}
```

### 5. client/src/components/payment/PayPalButton.tsx

```tsx
// CRITICAL - DO NOT MODIFY THIS CODE
import React, { useEffect } from "react";

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

interface PayPalButtonProps {
  amount: string;
  currency: string;
  intent: string;
}

export default function PayPalButton({
  amount,
  currency,
  intent,
}: PayPalButtonProps) {
  const createOrder = async () => {
    const orderPayload = {
      amount: amount,
      currency: currency,
      intent: intent,
    };
    const response = await fetch("/api/paypal/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload),
    });
    const output = await response.json();
    return { orderId: output.id };
  };

  const captureOrder = async (orderId: string) => {
    const response = await fetch(`/api/paypal/order/${orderId}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();

    return data;
  };

  const onApprove = async (data: any) => {
    console.log("onApprove", data);
    const orderData = await captureOrder(data.orderId);
    console.log("Capture result", orderData);
  };

  const onCancel = async (data: any) => {
    console.log("onCancel", data);
  };

  const onError = async (data: any) => {
    console.log("onError", data);
  };

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
      const sdkInstance = await (window as any).paypal.createInstance({
        clientToken,
        components: ["paypal-payments"],
      });

      const paypalCheckout =
            sdkInstance.createPayPalOneTimePaymentSession({
              onApprove,
              onCancel,
              onError,
            });

      const onClick = async () => {
        try {
          const checkoutOptionsPromise = createOrder();
          await paypalCheckout.start(
            { paymentFlow: "auto" },
            checkoutOptionsPromise,
          );
        } catch (e) {
          console.error(e);
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
      console.error(e);
    }
  };

  return <paypal-button id="paypal-button"></paypal-button>;
}
```

### 6. client/src/components/payment/StripeCheckoutForm.tsx

```tsx
import { useState, useEffect } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StripeCheckoutFormProps {
  amount: number;
  onSuccess?: (paymentId: string) => void;
  onError?: (error: Error) => void;
}

export default function StripeCheckoutForm({ amount, onSuccess, onError }: StripeCheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Performance tracking start
      const startTime = performance.now();
      
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-complete`,
        },
        redirect: 'if_required',
      });

      // Performance tracking end
      const processingTime = performance.now() - startTime;
      console.log(`Payment processing completed in ${processingTime.toFixed(0)}ms`);

      if (error) {
        setErrorMessage(error.message || 'Payment failed');
        toast({
          title: "Payment Failed",
          description: error.message || "Your payment could not be processed. Please try again.",
          variant: "destructive",
        });
        if (onError) onError(new Error(error.message));
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast({
          title: "Payment Successful",
          description: "Your booking has been confirmed!",
          variant: "default",
        });
        if (onSuccess) onSuccess(paymentIntent.id);
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setErrorMessage(err.message || 'An unexpected error occurred');
      if (onError) onError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      <PaymentElement />
      
      {errorMessage && (
        <div className="text-red-500 text-sm mt-2">
          {errorMessage}
        </div>
      )}
      
      <Button 
        type="submit"
        disabled={!stripe || isLoading}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay ${new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount)}`
        )}
      </Button>
    </form>
  );
}
```

### 7. shared/pricing-rules.ts (Journey Time Calculator)

```typescript
/**
 * Estimate travel time based on distance and conditions
 * Enhanced with more accurate time calculations for different regions and times of day
 */
export function estimateTravelTime(distanceMiles: number, moveDate?: Date): number {
  // Get time of day if date is provided (to factor in peak traffic times)
  let timeOfDay: 'early' | 'peak' | 'normal' | 'late' = 'normal';
  if (moveDate) {
    const hours = moveDate.getHours();
    if (hours >= 7 && hours < 10) timeOfDay = 'peak'; // Morning rush hour
    else if (hours >= 16 && hours < 19) timeOfDay = 'peak'; // Evening rush hour
    else if (hours >= 22 || hours < 5) timeOfDay = 'late'; // Late night
    else if (hours >= 5 && hours < 7) timeOfDay = 'early'; // Early morning
  }
  
  // Base speed calculation
  let baseSpeed = distanceMiles < 10 ? 18 : // Urban: 18mph
                 distanceMiles < 30 ? 25 : // Suburban: 25mph
                 distanceMiles < 100 ? 35 : // Regional: 35mph
                 45; // Highway: 45mph
  
  // Adjust for time of day
  const speedAdjustment = 
    timeOfDay === 'peak' ? 0.7 :  // 30% slower during peak hours
    timeOfDay === 'late' ? 1.3 :  // 30% faster during late night
    timeOfDay === 'early' ? 1.2 : // 20% faster during early morning
    1.0;                          // Normal speed otherwise
  
  // Calculate adjusted speed
  const adjustedSpeed = baseSpeed * speedAdjustment;
  
  // Base driving time with adjusted speed
  const drivingTime = distanceMiles / adjustedSpeed;
  
  // Add loading/unloading buffer based on distance (more items likely for longer distance)
  const loadingBuffer = distanceMiles < 20 ? 0.5 : // 30 minutes for short moves
                       distanceMiles < 50 ? 0.75 : // 45 minutes for medium moves
                       1.0;                         // 1 hour for long moves
  
  // Add mandatory breaks for longer journeys (1 break per 2 hours of driving)
  const breakTime = distanceMiles > 50 ? Math.floor(drivingTime / 2) * 0.25 : 0;
  
  // Add potential delay time for unforeseen circumstances (traffic incidents, etc.)
  // 5% of driving time for shorter journeys, 10% for longer ones
  const delayBuffer = drivingTime * (distanceMiles > 100 ? 0.1 : 0.05);
  
  // Total estimated time: driving + breaks + loading/unloading + potential delays
  return drivingTime + breakTime + loadingBuffer + delayBuffer;
}
```

### 8. client/src/components/quote/DetailedItemsForm.tsx (Moving Items Form)

```tsx
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { X, Plus, Edit, Save } from "lucide-react";

export interface Item {
  id: string;
  name: string;
  description: string;
  quantity: number;
  category: string;
  dimensions?: string;
  weight?: string;
  fragile: boolean;
  specialHandling: boolean;
}

export interface DetailedItemsFormProps {
  onSubmit: (items: Item[]) => void;
  initialItems?: Item[];
}

const ITEM_CATEGORIES = [
  'Furniture',
  'Electronics',
  'Kitchen',
  'Boxes',
  'Appliances',
  'Fragile',
  'Outdoor',
  'Office',
  'Artwork',
  'Other'
];

export default function DetailedItemsForm({ onSubmit, initialItems = [] }: DetailedItemsFormProps) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [currentItem, setCurrentItem] = useState<Item>({
    id: '',
    name: '',
    description: '',
    quantity: 1,
    category: 'Furniture',
    dimensions: '',
    weight: '',
    fragile: false,
    specialHandling: false
  });
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateItem = (item: Item): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    
    if (!item.name.trim()) {
      newErrors.name = 'Item name is required';
    }
    
    if (item.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }
    
    return newErrors;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setCurrentItem(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      [name]: name === 'quantity' ? parseInt(value) || 0 : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setCurrentItem(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setCurrentItem(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleAddItem = () => {
    const newErrors = validateItem(currentItem);
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    const newItem = {
      ...currentItem,
      id: editingItemId || Date.now().toString()
    };
    
    if (editingItemId) {
      // Update existing item
      setItems(items.map(item => item.id === editingItemId ? newItem : item));
      setEditingItemId(null);
    } else {
      // Add new item
      setItems([...items, newItem]);
    }
    
    // Reset form
    setCurrentItem({
      id: '',
      name: '',
      description: '',
      quantity: 1,
      category: 'Furniture',
      dimensions: '',
      weight: '',
      fragile: false,
      specialHandling: false
    });
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(items);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Detailed Item Description</CardTitle>
          <CardDescription>
            Add all items you need to move for an accurate quote
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name*</Label>
                <Input 
                  id="name"
                  name="name"
                  value={currentItem.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Sofa, TV, Box of books"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={currentItem.category} 
                  onValueChange={(value) => handleSelectChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEM_CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity*</Label>
                <Input 
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  value={currentItem.quantity}
                  onChange={handleInputChange}
                  className={errors.quantity ? "border-red-500" : ""}
                />
                {errors.quantity && <p className="text-red-500 text-sm">{errors.quantity}</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="dimensions">Dimensions (optional)</Label>
                  <Input 
                    id="dimensions"
                    name="dimensions"
                    value={currentItem.dimensions || ''}
                    onChange={handleInputChange}
                    placeholder="e.g. 2m x 1m x 0.5m"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (optional)</Label>
                  <Input 
                    id="weight"
                    name="weight"
                    value={currentItem.weight || ''}
                    onChange={handleInputChange}
                    placeholder="e.g. 20kg"
                  />
                </div>
              </div>
              
              <div className="space-y-2 col-span-1 md:col-span-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea 
                  id="description"
                  name="description"
                  value={currentItem.description}
                  onChange={handleInputChange}
                  placeholder="Add any details that might help with the move"
                  rows={2}
                />
              </div>
              
              <div className="flex space-x-4 items-center col-span-1 md:col-span-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="fragile"
                    name="fragile"
                    checked={currentItem.fragile}
                    onChange={(e) => handleCheckboxChange('fragile', e.target.checked)}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <Label htmlFor="fragile">Fragile</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="specialHandling"
                    name="specialHandling"
                    checked={currentItem.specialHandling}
                    onChange={(e) => handleCheckboxChange('specialHandling', e.target.checked)}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <Label htmlFor="specialHandling">Requires special handling</Label>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1"
              >
                {editingItemId ? (
                  <>
                    <Save className="h-4 w-4" />
                    Update Item
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add Item
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Items List ({items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="w-16 text-center">Qty</TableHead>
                    <TableHead>Dimensions</TableHead>
                    <TableHead>Special</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell>{item.dimensions || '-'}</TableCell>
                      <TableCell>
                        {(item.fragile || item.specialHandling) ? (
                          <div className="flex flex-col text-xs">
                            {item.fragile && <span>Fragile</span>}
                            {item.specialHandling && <span>Special handling</span>}
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {/* Edit handler */}}
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {/* Remove handler */}}
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t p-4">
            <div className="text-sm text-muted-foreground">
              {items.length} {items.length === 1 ? 'item' : 'items'} added
            </div>
            <Button onClick={handleSubmit}>
              Generate Accurate Quote
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
```

## Environment Variables Needed

For deployment, make sure these environment variables are set:

```
# Database Connection
DATABASE_URL=postgresql://user:password@host:port/database

# Stripe Integration
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLIC_KEY=pk_test_...

# PayPal Integration
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# Google Maps for distance calculation
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# General Config
NODE_ENV=production
PORT=5000
```

## Deployment Instructions

1. Set all required environment variables in your hosting environment
2. Run `npm install` to install dependencies
3. Run `npm run build` to build the application
4. Run `npm run db:push` to update the database schema
5. Run `npm start` to start the server in production mode

The application should now be running with all key components like payment processing, detailed item specification, and accurate journey time calculation.