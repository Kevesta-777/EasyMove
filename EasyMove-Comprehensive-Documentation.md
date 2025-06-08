# EasyMove Man and Van - Comprehensive Code Documentation

## Table of Contents

1. [Application Overview](#application-overview)
2. [Project Structure](#project-structure)
3. [Frontend Components](#frontend-components)
   - [Layout Components](#layout-components)
   - [Page Components](#page-components)
   - [UI Components](#ui-components)
   - [Form Components](#form-components)
   - [Payment Components](#payment-components)
4. [Backend Structure](#backend-structure)
   - [API Routes](#api-routes)
   - [Database Schema](#database-schema)
   - [Services](#services)
5. [Payment Integration](#payment-integration)
   - [Stripe Integration](#stripe-integration)
   - [PayPal Integration](#paypal-integration)
6. [Quote Calculation Engine](#quote-calculation-engine)
   - [Distance Calculation](#distance-calculation)
   - [Pricing Formula](#pricing-formula)
   - [VAT Handling](#vat-handling)
7. [Authentication & Authorization](#authentication--authorization)
8. [Error Handling](#error-handling)
9. [Performance Optimizations](#performance-optimizations)
10. [Deployment](#deployment)

---

## Application Overview

EasyMove Man and Van is a sophisticated transport service platform that provides transparent, data-driven pricing and a seamless user experience for booking removal services. The application focuses on accurate quote generation based on distance, van size, and other factors, with integrated payment processing using Stripe and PayPal.

The service specifically targets the North East, London, West Midlands, Essex, and Peterborough regions, offering competitive pricing and a user-friendly interface.

### Core Features

- Instant quote generation based on distance, van size, and service requirements
- Multiple payment options (Stripe, PayPal) with optimized processing
- Van size selection with visual guidance
- User registration and login system
- Driver registration and verification
- Booking management for both customers and drivers
- Responsive design for mobile and desktop users

---

## Project Structure

The project follows a modern full-stack JavaScript architecture with React.js frontend (TypeScript) and Express.js backend:

```
/
├── client/                 # Frontend code
│   ├── src/
│   │   ├── assets/         # Static assets and generated images
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility libraries
│   │   ├── pages/          # Page components
│   │   ├── styles/         # CSS and styling files
│   │   ├── App.tsx         # Main app component
│   │   └── index.tsx       # Frontend entry point
│   └── ...
├── server/                 # Backend code
│   ├── routes.ts           # API route definitions
│   ├── storage.ts          # Database operations
│   ├── db.ts               # Database connection
│   ├── paypal.ts           # PayPal integration
│   ├── index.ts            # Server entry point
│   └── ...
├── shared/                 # Shared code between frontend and backend
│   └── schema.ts           # Data models and types
└── ...
```

---

## Frontend Components

### Layout Components

#### `Header.tsx`

The Header component provides the main navigation for the application in desktop view. It includes:

- Company logo
- Features dropdown menu
- Phone number
- Call-to-action buttons (Join as Driver, Get Quote)

```typescript
// Key features
const Header = ({ onMenuToggle }: HeaderProps) => {
  // Function to scroll to quote form
  const scrollToQuoteForm = (event: React.MouseEvent) => {
    // Implementation details
  };

  return (
    <header>
      {/* Logo section */}
      {/* Features dropdown with links to key sections */}
      {/* Contact information */}
      {/* Action buttons */}
    </header>
  );
};
```

#### `MobileMenu.tsx`

The mobile navigation menu that appears when the hamburger icon is clicked. Contains:

- Features dropdown menu with all site sections
- Contact information
- Call-to-action buttons

```typescript
// Key implementation details
const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  
  // Toggle submenu sections
  const toggleMenu = (menu: string) => {
    if (activeMenu === menu) {
      setActiveMenu(null);
    } else {
      setActiveMenu(menu);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-70 backdrop-blur-sm z-50">
      {/* Menu structure */}
      {/* Features dropdown */}
      {/* Contact information */}
      {/* Action buttons */}
    </div>
  );
};
```

#### `Footer.tsx`

Contains:
- Company information
- Links to important pages
- Social media links
- Copyright information

### Page Components

#### `Home.tsx`

The main landing page with:
- Hero section
- Features section
- How it works
- Van size guide
- Areas covered
- Quote form
- FAQ section
- Customer testimonials

#### `Calculator.tsx`

Interactive price calculator allowing users to:
- Enter origin and destination addresses
- Select van size
- Choose additional services
- Get instant price quotes

#### `Checkout.tsx`

Handles the payment process with:
- Order summary
- Payment method selection (Stripe/PayPal)
- Payment form

#### `DriverRegistration.tsx`

Form for drivers to apply to join the platform:
- Personal information
- Vehicle details
- License and insurance information
- Areas covered

### Payment Components

#### `StripeCheckoutForm.tsx`

Handles Stripe payment processing with:
- Card element
- Payment submission
- Success/error handling

```typescript
export default function StripeCheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    const cardElement = elements.getElement(CardElement);
    
    // Process payment with Stripe
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/payment-success',
      },
    });

    if (error) {
      setErrorMessage(error.message || 'An error occurred');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Card element and submit button */}
    </form>
  );
}
```

#### `PayPalButton.tsx`

Manages PayPal payment flow with:
- PayPal button
- Order creation
- Order capture
- Success/error handling

```typescript
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
    return await response.json();
  };

  // Initialize PayPal SDK
  useEffect(() => {
    // PayPal initialization logic
  }, []);

  return <paypal-button id="paypal-button"></paypal-button>;
}
```

---

## Backend Structure

### API Routes

The server exposes several API endpoints for the frontend to interact with:

#### Quote and Pricing Routes

```typescript
// Calculate distance between two addresses
app.post("/api/distance", async (req, res) => {
  // Implementation uses either Google Maps API or fallback calculation
});

// Generate a complete quote
app.post("/api/quotes/calculate", async (req, res) => {
  // Full quote calculation with all factors
});

// Generate a simplified quote (fewer parameters)
app.post("/api/quotes/simple", async (req, res) => {
  // Simplified quote for quick estimates
});
```

#### Payment Routes

```typescript
// Stripe payment intent creation
app.post("/api/create-payment-intent", async (req, res) => {
  const { amount } = req.body;
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: "usd",
  });
  res.json({ clientSecret: paymentIntent.client_secret });
});

// PayPal setup endpoint
app.get("/api/paypal/setup", async (req, res) => {
  await loadPaypalDefault(req, res);
});

// PayPal order creation
app.post("/api/paypal/order", async (req, res) => {
  await createPaypalOrder(req, res);
});

// PayPal order capture
app.post("/api/paypal/order/:orderID/capture", async (req, res) => {
  await capturePaypalOrder(req, res);
});

// PayPal token warm-up for faster processing
app.get("/api/paypal/warmup", async (req, res) => {
  const startTime = performance.now();
  // Preload PayPal token for faster checkout
  await warmupPayPalToken();
  const processingTime = Math.round(performance.now() - startTime);
  res.json({
    success: true,
    processingTime,
    message: `PayPal warm-up completed in ${processingTime}ms`
  });
});
```

#### User and Driver Routes

```typescript
// User registration
app.post("/api/users/register", async (req, res) => {
  // User creation logic
});

// User login
app.post("/api/users/login", async (req, res) => {
  // Authentication logic
});

// Driver registration
app.post("/api/drivers/register", async (req, res) => {
  // Driver registration logic
});
```

#### Booking Routes

```typescript
// Create booking
app.post("/api/bookings", async (req, res) => {
  // Booking creation logic
});

// Get user bookings
app.get("/api/users/:userId/bookings", async (req, res) => {
  // Fetch user bookings
});

// Get driver bookings
app.get("/api/drivers/:driverId/bookings", async (req, res) => {
  // Fetch driver bookings
});
```

### Database Schema

The application's database schema is defined in `shared/schema.ts`:

```typescript
// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
});

// Driver model
export const drivers = pgTable("drivers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  vehicleType: varchar("vehicle_type", { length: 50 }),
  licenseNumber: varchar("license_number", { length: 50 }),
  isApproved: boolean("is_approved").default(false),
  areas: text("areas").array(),
  availability: jsonb("availability"),
});

// Booking model
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => users.id),
  driverId: integer("driver_id").references(() => drivers.id),
  origin: varchar("origin", { length: 255 }).notNull(),
  destination: varchar("destination", { length: 255 }).notNull(),
  date: timestamp("date").notNull(),
  status: varchar("status", { length: 20 }).default("pending"),
  price: numeric("price").notNull(),
  distance: numeric("distance"),
  vanSize: varchar("van_size", { length: 20 }),
  additionalServices: jsonb("additional_services"),
  paymentId: varchar("payment_id", { length: 255 }),
  paymentStatus: varchar("payment_status", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Pricing model
export const pricingModels = pgTable("pricing_models", {
  id: serial("id").primaryKey(),
  baseRate: numeric("base_rate").notNull(),
  perMileRate: numeric("per_mile_rate").notNull(),
  hourlyRates: jsonb("hourly_rates").notNull(),
  vanSizeMultipliers: jsonb("van_size_multipliers").notNull(),
  peakTimeSurcharge: numeric("peak_time_surcharge"),
  holidaySurcharge: numeric("holiday_surcharge"),
  urgencySurcharges: jsonb("urgency_surcharges"),
  fuelCostPerMile: numeric("fuel_cost_per_mile"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Area demand model
export const areaDemand = pgTable("area_demand", {
  id: serial("id").primaryKey(),
  areaName: varchar("area_name", { length: 100 }).notNull().unique(),
  demandMultiplier: numeric("demand_multiplier").default("1.0"),
  isHighDemand: boolean("is_high_demand").default(false),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Pricing history for analytics
export const pricingHistory = pgTable("pricing_history", {
  id: serial("id").primaryKey(),
  origin: varchar("origin", { length: 255 }).notNull(),
  destination: varchar("destination", { length: 255 }).notNull(),
  distance: numeric("distance").notNull(),
  price: numeric("price").notNull(),
  vanSize: varchar("van_size", { length: 20 }),
  date: timestamp("date").defaultNow(),
  bookingId: integer("booking_id").references(() => bookings.id),
});
```

### Services

#### Distance Calculation Service

Found in `server/services/fixed-distance-calculator.ts`, this service handles accurate distance calculations between two addresses:

```typescript
// Primary distance calculation function
export async function calculateDistance(origin: string, destination: string): Promise<DistanceResult> {
  try {
    // Try Google Maps API first
    return await calculateDistanceWithGoogleMaps(origin, destination);
  } catch (error) {
    console.warn("Failed to calculate distance with Google Maps, using fallback", error);
    // Fallback to estimation
    return fallbackDistanceCalculation(origin, destination);
  }
}

// Google Maps implementation
async function calculateDistanceWithGoogleMaps(origin: string, destination: string): Promise<DistanceResult> {
  // Implementation details
}

// Fallback calculation using postal code data and haversine formula
function fallbackDistanceCalculation(origin: string, destination: string): DistanceResult {
  // Implementation details
}
```

#### Payment Services

The application includes specialized services for payment processing:

1. **Stripe Service**: Handles Stripe payment integration with robust error handling and logging.
2. **PayPal Service**: Manages PayPal integration with token caching for improved performance.

```typescript
// PayPal token caching for performance
let cachedPayPalToken: string | null = null;
let tokenExpiry: number = 0;

export async function getClientToken() {
  // Check if we have a valid cached token
  if (cachedPayPalToken && tokenExpiry > Date.now()) {
    console.log("Using cached PayPal token");
    return cachedPayPalToken;
  }

  console.log("Getting fresh PayPal client token...");
  
  // Implementation details for fetching new token
  
  // Cache the token for future use
  cachedPayPalToken = result.accessToken;
  // Set expiry to 5 minutes before actual expiry to be safe
  tokenExpiry = Date.now() + (result.expiresIn * 1000) - (5 * 60 * 1000);
  
  return result.accessToken;
}
```

---

## Payment Integration

### Stripe Integration

The app integrates Stripe for card payments with the following features:
- Payment Intent API for direct payment processing
- Elements UI components for secure card input
- Webhooks for payment status updates
- Customer and subscription management

Key implementation files:
- `client/src/components/payment/StripeCheckoutForm.tsx`
- `server/routes.ts` (payment endpoints)

### PayPal Integration

The PayPal integration is highly optimized for performance:
- Background token prefetching to reduce payment initialization time
- Token caching to minimize API calls
- Robust error handling with fallbacks
- Comprehensive logging for debugging

Key implementation files:
- `client/src/components/payment/PayPalButton.tsx`
- `server/paypal.ts`

---

## Quote Calculation Engine

### Distance Calculation

The application uses a multi-tier approach for distance calculation:
1. Google Maps Distance Matrix API (when available)
2. Fallback calculation using postal code data
3. Estimation based on address components

```typescript
// Distance calculation with fallbacks
export async function calculateDistance(origin: string, destination: string): Promise<DistanceResult> {
  try {
    // Primary method
    return await calculateWithAPI(origin, destination);
  } catch (error) {
    // First fallback
    try {
      return calculateWithPostcodes(origin, destination);
    } catch (fallbackError) {
      // Final fallback
      return estimateDistance(origin, destination);
    }
  }
}
```

### Pricing Formula

The pricing engine considers multiple factors:
- Base rate (fixed starting fee)
- Distance-based charge (per mile)
- Van size multiplier
- Hourly charges (time-based component)
- Peak time surcharges
- Holiday surcharges
- Urgency surcharges
- Fuel costs
- Return journey considerations

```typescript
// Core pricing calculation function
export function calculateTotalPrice(params: QuoteParams): QuoteResult {
  const {
    distanceMiles,
    vanSize,
    date,
    hours,
    isUrban,
    additionalServices,
    urgency,
  } = params;

  // Calculate base components
  const baseCharge = PRICING.BASE_FARE;
  const distanceCharge = calculateDistanceCharge(distanceMiles, vanSize, isUrban);
  const vanSizeMultiplier = calculateVanSizeMultiplier(vanSize);
  const timeCharge = calculateTimeCharge(vanSize, hours);
  
  // Calculate surcharges
  const peakTimeSurcharge = calculatePeakTimeSurcharge(date);
  const urgencySurcharge = calculateUrgencySurcharge(urgency);
  const holidaySurcharge = isUKHoliday(date) ? PRICING.HOLIDAY_SURCHARGE : 0;
  
  // Additional components
  const fuelCost = calculateFuelCost(distanceMiles, vanSize);
  const returnJourneyCost = calculateReturnJourneyCost(distanceMiles, vanSize);
  
  // Additional services
  const addonsTotal = calculateAdditionalServices(additionalServices);
  
  // Calculate subtotal
  const subtotal = baseCharge + distanceCharge + timeCharge + 
                  peakTimeSurcharge + urgencySurcharge + holidaySurcharge +
                  fuelCost + returnJourneyCost + addonsTotal;
  
  // Apply VAT
  const vat = calculateVAT(subtotal);
  const total = calculatePriceWithVAT(subtotal);
  
  // Build detailed breakdown
  return {
    total,
    breakdown: {
      baseCharge,
      distanceCharge,
      timeCharge,
      peakTimeSurcharge,
      urgencySurcharge,
      holidaySurcharge,
      fuelCost,
      returnJourneyCost,
      addonsTotal,
      subtotal,
      vat,
    }
  };
}
```

### VAT Handling

The application properly handles UK VAT:
- Standard 20% VAT rate applied to all services
- VAT breakdown shown in quotes and receipts
- VAT included in final price display

```typescript
// VAT calculation functions
export function calculateVAT(price: number): number {
  return parseFloat((price * VAT_RATE).toFixed(2));
}

export function calculatePriceWithVAT(price: number): number {
  return parseFloat((price * (1 + VAT_RATE)).toFixed(2));
}
```

---

## Authentication & Authorization

The application uses Passport.js for authentication with local strategy:
- Secure password hashing with bcrypt
- JWT token authentication
- Protected API routes
- Role-based access control (customer/driver/admin)

---

## Error Handling

The app implements comprehensive error handling:
- Global error handler middleware
- Specific error handlers for payment processing
- User-friendly error messages
- Detailed error logging for debugging
- Fallbacks for critical functionality

```typescript
// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(`[ERROR] ${err.stack}`);
  
  // Custom error handling based on error type
  if (err instanceof PaymentError) {
    return res.status(400).json({ 
      error: "Payment processing failed", 
      message: err.message 
    });
  }
  
  if (err instanceof ValidationError) {
    return res.status(400).json({ 
      error: "Validation error", 
      details: err.details 
    });
  }
  
  // Default error response
  return res.status(500).json({ 
    error: "An unexpected error occurred",
    message: process.env.NODE_ENV === "production" 
      ? "Please try again later" 
      : err.message
  });
});
```

---

## Performance Optimizations

The application includes various performance optimizations:
- PayPal token prefetching and caching
- React component memoization
- Lazy loading of heavy components
- Database query optimization
- CDN for static assets
- API response caching where appropriate

```typescript
// PayPal token prefetching example
export async function warmupPayPalToken() {
  try {
    console.log("Pre-fetching PayPal token in background...");
    const startTime = performance.now();
    await getClientToken();
    const processingTime = Math.round(performance.now() - startTime);
    console.log(`PayPal token preloaded in ${processingTime}ms`);
    return true;
  } catch (error) {
    console.error("Failed to preload PayPal token:", error);
    return false;
  }
}

// Call this at server startup
warmupPayPalToken();
```

---

## Deployment

The application is deployed using Replit's platform, with additional configuration available for:
- Render
- Vercel
- Netlify

Configuration files:
- `render.yaml` - Render deployment configuration
- `EasyMoveManAndVan-vercel.json` - Vercel deployment settings
- `EasyMoveManAndVan-netlify.toml` - Netlify configuration

---

## Environment Variables

The application requires the following environment variables to be set:

```
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Stripe
VITE_STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# PayPal
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...

# Optional: Google Maps API (for enhanced distance calculation)
GOOGLE_MAPS_API_KEY=...
```

---

## Testing

Testing infrastructure includes:
- Unit tests with Jest
- Integration tests with Supertest
- E2E tests with Cypress
- Load testing with Artillery

---

## Conclusion

This comprehensive documentation covers all major aspects of the EasyMove Man and Van application, providing a complete reference for developers working on the project.

The application combines a modern React.js frontend with a robust Express.js backend, integrated with multiple payment providers and a sophisticated pricing engine to provide a seamless experience for users seeking man and van services.