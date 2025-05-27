# EasyMove Man and Van - Quote Calculation Fix Implementation

This document provides step-by-step instructions for implementing the quote calculation fixes to ensure accurate distance calculations and pricing.

## Overview of Issues

1. **Google Maps API Issues**: The Google Maps API is returning "REQUEST_DENIED" errors even with an updated API key.
2. **Distance Calculation Accuracy**: The fallback method is not providing accurate distances.
3. **Price Calculation Inconsistency**: Prices vary between quote generation and checkout.
4. **Rounding Issues**: Inconsistent rounding causes price discrepancies.

## Implementation Steps

### 1. Replace the Distance Calculator

The first step is to implement our reliable distance calculator that doesn't depend on external APIs:

1. Add the new `fixed-distance-calculator.ts` file to the `server/services` directory.
2. Modify `server/routes.ts` to use the new distance calculator by adding these lines at the top:

```typescript
// Add this import at the top of the file
import { calculateDistance } from "./services/fixed-distance-calculator";

// Remove or comment out the import for the old distance calculator
// import { calculateDistance } from "./services/distance-calculator";
```

### 2. Fix the Quote Calculation Routes

1. Add the `distance-routes-fix.ts` file to the `server` directory.
2. Update `server/routes.ts` to use the fixed routes:

```typescript
// Add this import at the top of the file
import { registerDistanceRoutes } from "./distance-routes-fix";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register the fixed distance calculation routes
  registerDistanceRoutes(app);
  
  // Rest of your existing route registrations...
  
  return httpServer;
}

// Remove or comment out the existing /api/distance and /api/quotes/calculate routes
```

### 3. Fix Price Calculation Rounding

Add these helper functions to `shared/pricing-rules.ts`:

```typescript
// Add these helper functions near the top of the file
function roundPrice(price: number): number {
  return Math.round(price * 100) / 100;
}

function roundToNearestPound(price: number): number {
  return Math.round(price);
}

// Update the existing calculation functions
export function calculateVAT(price: number): number {
  // Always calculate VAT consistently: 20% of the price
  return roundPrice(price * 0.20);
}

export function calculatePriceWithVAT(price: number): number {
  // Calculate total with VAT (20% more)
  return roundPrice(price * 1.20);
}

export function formatPrice(price: number): string {
  // Format with the currency symbol and always 2 decimal places
  return `${PRICING_CONSTANTS.CURRENCY}${price.toFixed(2)}`;
}
```

### 4. Fix Quote Storage in Frontend

Update `client/src/contexts/QuoteContext.tsx` to improve quote storage:

```typescript
// Add these functions to the QuoteContext.tsx file

function saveQuoteToStorage(quote: Quote) {
  if (!quote) return;
  
  try {
    // Ensure all required fields are present
    const requiredFields = [
      'totalPrice', 'finalPrice', 'totalWithVAT', 
      'pickupAddress', 'deliveryAddress', 'distance', 'vanSize'
    ];
    
    for (const field of requiredFields) {
      if (quote[field as keyof Quote] === undefined) {
        console.error(`Cannot save quote: Missing required field: ${field}`);
        return false;
      }
    }
    
    // Convert any date objects to ISO strings
    const processedQuote = { ...quote };
    if (processedQuote.moveDate instanceof Date) {
      processedQuote.moveDate = processedQuote.moveDate.toISOString();
    }
    
    // Save to localStorage
    localStorage.setItem('easyMoveQuote', JSON.stringify(processedQuote));
    console.log('Quote saved to localStorage:', processedQuote);
    return true;
  } catch (error) {
    console.error('Error saving quote to localStorage:', error);
    return false;
  }
}

// Update the setQuote function in the QuoteProvider
const setQuote = (newQuote: Quote) => {
  saveQuoteToStorage(newQuote);
  setQuoteState(newQuote);
};
```

### 5. Update Payment Handling

Ensure payment processing uses the correct quote amount by adding this check to payment handlers:

```typescript
// Add this to Stripe payment handler
function getPaymentAmountFromQuote(quote) {
  if (!quote) {
    console.error('No quote data provided for payment');
    return null;
  }
  
  // Always use the VAT-inclusive total price for payments
  const amount = quote.totalWithVAT;
  
  if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    console.error('Invalid payment amount calculated:', amount);
    return null;
  }
  
  // Calculate deposit amount (25% of total)
  const depositAmount = Math.round(amount * 0.25);
  
  // Return payment data
  return {
    finalPrice: amount,
    depositAmount: depositAmount,
    driverShare: amount - depositAmount,
    totalWithVAT: amount
  };
}
```

## Testing the Fix

After implementing these changes, test the quote calculation with these scenarios:

1. **Local City Pairs**: Test with city pairs like "London to Manchester" or "Portsmouth to Newcastle"
2. **Specific Addresses**: Test with detailed addresses to verify city extraction
3. **Quote to Payment Flow**: Test the entire flow from quote to payment to ensure consistency

## Expected Results

- Distance calculations should match expected real-world driving distances
- Price calculations should be consistent throughout the application
- Quotes should persist correctly between pages
- Payment amounts should match the quoted prices

By implementing these fixes, the application will provide accurate quotes without depending on external APIs and ensure pricing consistency throughout the booking process.