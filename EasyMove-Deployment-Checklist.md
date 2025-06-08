# EasyMove Man and Van - Deployment Checklist

## Application Overview

EasyMove Man and Van is a transport service platform offering transparent, data-driven pricing solutions with quote generation and payment processing.

### Core Features

- **Price Calculator**: Advanced pricing calculation with distance, van size, helpers, and time factors
- **Quote Generation**: Instant quotes with comprehensive breakdown including VAT
- **Distance Calculation**: Address-to-address distance estimation
- **Payment Processing**: Dual payment options (Stripe and PayPal)
- **Responsive Design**: Mobile-first approach for all devices

## Deployment Requirements

### Frontend Assets

- React.js application with TypeScript
- Tailwind CSS styling
- SVG assets for van types (small, medium, large, luton)
- React components for UI elements

### Backend Services

- Express.js REST API
- PostgreSQL database integration
- Payment processing endpoints
- Distance calculation service

### Database Schema

- Users table (customer information)
- Drivers table (driver profiles)
- Bookings table (transport bookings)
- Pricing models (pricing configuration)

## Configuration Requirements

### Environment Variables (DO NOT INCLUDE ACTUAL VALUES)

- **Stripe Configuration**: Keys will be set in hosting environment
- **PayPal Configuration**: Keys will be set in hosting environment
- **Database Connection**: URL will be set in hosting environment
- **Google Maps API**: Key will be set in hosting environment (optional)

## API Endpoints

### Price Calculation

- `POST /api/quotes/calculate`: Generate a price quote
- `POST /api/quotes/distance`: Calculate distance between addresses

### Payment Processing

- `POST /api/create-payment-intent`: Initiate Stripe payment
- `POST /api/create-checkout-session`: Create Stripe checkout session
- `GET /api/paypal/setup`: Initialize PayPal SDK
- `POST /api/paypal/order`: Create PayPal order
- `POST /api/paypal/order/:orderID/capture`: Capture PayPal payment

### Image Generation

- `GET /api/images/van/:size`: Get van type SVG
- `GET /api/images/service/:type`: Get service type image

### Health Check

- `GET /api/health`: System health status for monitoring

## Build Instructions

1. Install dependencies: `npm install`
2. Build frontend: `npm run build`
3. Start server: `npm run start`

## Deployment Procedure

1. Push code to GitHub repository
2. Set up hosting environment (Render, Vercel, or Netlify)
3. Configure environment variables (see `.env.example`)
4. Deploy application
5. Verify health check endpoint
6. Test payment processing with test cards

## Architecture Notes

### Frontend Architecture

- React.js with functional components and hooks
- Context API for state management
- React Query for API data fetching
- React Hook Form for form handling

### Backend Architecture

- Express.js REST API
- Drizzle ORM for database operations
- Service-oriented architecture with clean separation of concerns

## Payment Processing Setup

### Stripe Integration

- Redirect-based checkout flow
- 25% deposit payment processing
- Platform fee handling

### PayPal Integration

- SDK-based implementation
- Order creation and capture flow

## Security Considerations

- All API keys stored as environment variables
- Payment processing on server-side only
- Input validation with Zod schema
- CORS configuration for production

## Monitoring

- Health check endpoint for uptime monitoring
- Payment webhook configuration for transaction verification
- Server logs for error tracking

---

**IMPORTANT:** This document does not contain any actual API keys, secrets, or sensitive configuration values. All such values must be securely configured in the hosting environment's configuration system.