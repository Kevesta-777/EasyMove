
# EasyMove Man and Van - Complete Platform Documentation

## Table of Contents
1. Project Overview
2. Directory Structure
3. Frontend Implementation
4. Backend Implementation
5. Shared Code
6. Configuration Files
7. Testing Tools

## 1. Project Overview

EasyMove Man and Van is a transport service platform built with:
- Frontend: React + TypeScript + Tailwind CSS
- Backend: Express.js + Node.js
- Database: PostgreSQL with Drizzle ORM
- Payment: Stripe and PayPal integrations
- State Management: React Query

## 2. Directory Structure

```
EasyMove/
├── client/
│   └── src/
│       ├── components/
│       ├── contexts/
│       ├── hooks/
│       ├── lib/
│       ├── pages/
│       └── assets/
├── server/
│   ├── services/
│   └── routes/
└── shared/
```

## 3. Frontend Implementation

### Components

#### PriceCalculator.tsx
```typescript
import React, { useState } from 'react';
import { calculatePrice } from '../lib/utils/quote-calculator';

export const PriceCalculator: React.FC = () => {
  const [quote, setQuote] = useState(null);
  
  const handleSubmit = async (data) => {
    const price = await calculatePrice(data);
    setQuote(price);
  };

  return (
    <div className="price-calculator">
      <form onSubmit={handleSubmit}>
        {/* Form fields */}
      </form>
      {quote && (
        <div className="quote-result">
          {/* Quote display */}
        </div>
      )}
    </div>
  );
};
```

#### PaymentProcessing.tsx
```typescript
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

export const PaymentProcessing: React.FC = () => {
  return (
    <Elements stripe={loadStripe('STRIPE_PUBLIC_KEY_PLACEHOLDER')}>
      <PaymentForm />
    </Elements>
  );
};
```

### Hooks

#### useQuoteCalculation.ts
```typescript
import { useState, useEffect } from 'react';

export const useQuoteCalculation = (data) => {
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Quote calculation logic
  }, [data]);

  return { loading, quote, error };
};
```

## 4. Backend Implementation

### Server Setup (index.ts)
```typescript
import express from 'express';
import { registerRoutes } from './routes';
import { setupDatabase } from './services/db-setup';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Register routes
registerRoutes(app);

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Quote Calculation Service
```typescript
export class QuoteCalculationService {
  static calculateBasePrice(distance: number, vanSize: string): number {
    const baseRate = 40;
    const perMileRate = 2.5;
    return baseRate + (distance * perMileRate);
  }

  static applyVanSizeMultiplier(price: number, vanSize: string): number {
    const multipliers = {
      small: 1,
      medium: 1.2,
      large: 1.5,
      luton: 1.8
    };
    return price * multipliers[vanSize];
  }
}
```

### Payment Processing Service
```typescript
export class PaymentService {
  static async createPaymentIntent(amount: number) {
    // Stripe payment intent creation logic
  }

  static async processPayPalPayment(orderData: any) {
    // PayPal payment processing logic
  }
}
```

## 5. Shared Code

### Types (types.ts)
```typescript
export interface Quote {
  distance: number;
  basePrice: number;
  vanSize: string;
  helpers: number;
  totalPrice: number;
  vat: number;
}

export interface PaymentIntent {
  clientSecret: string;
  amount: number;
  currency: string;
}
```

### Constants (constants.ts)
```typescript
export const PRICING_CONSTANTS = {
  BASE_RATE: 40,
  PER_MILE_RATE: 2.5,
  VAT_RATE: 0.2,
  HELPER_RATE: 25,
};

export const VAN_SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
  LUTON: 'luton',
};
```

## 6. Configuration Files

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### tailwind.config.ts
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0097FB',
        secondary: '#2A2A2A',
        accent: '#97FB00',
      },
    },
  },
  plugins: [],
};

export default config;
```

## 7. Testing Tools

### Quote Calculator Test
```typescript
import { QuoteCalculationService } from '../services/quote-calculation';

describe('Quote Calculation', () => {
  test('calculates base price correctly', () => {
    const price = QuoteCalculationService.calculateBasePrice(10, 'small');
    expect(price).toBe(65); // 40 + (10 * 2.5)
  });

  test('applies van size multiplier correctly', () => {
    const price = QuoteCalculationService.applyVanSizeMultiplier(100, 'medium');
    expect(price).toBe(120); // 100 * 1.2
  });
});
```

### Payment Integration Test
```typescript
import { PaymentService } from '../services/payment';

describe('Payment Processing', () => {
  test('creates payment intent successfully', async () => {
    const paymentIntent = await PaymentService.createPaymentIntent(1000);
    expect(paymentIntent).toHaveProperty('clientSecret');
  });
});
```

## Conclusion

This documentation provides a complete overview of the EasyMove Man and Van platform's codebase. All sensitive information has been replaced with placeholders. To implement this platform:

1. Set up the project structure as outlined
2. Install required dependencies
3. Configure environment variables with actual values
4. Deploy the application using Replit

For the actual implementation, replace all placeholder values with real configuration data and add proper error handling and validation throughout the codebase.
