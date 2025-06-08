# EasyMove Man and Van - Application Documentation

## Overview

EasyMove Man and Van is a sophisticated transportation service platform that provides transparent, data-driven pricing solutions with a focus on seamless user experience and efficient quote generation. This application is designed to compete with established competitors like "Any Man and Van" and "Compare the Man and Van" by providing accurate distance calculations, consistent pricing, and a smooth checkout experience.

### Key Features

- **Accurate Quote Generation**: Sophisticated pricing algorithm that considers distance, time, vehicle size, and additional services
- **Multiple Payment Options**: Integrated Stripe, PayPal, and Klarna payment gateways
- **Detailed Item Management**: Ability to specify individual items for more accurate quotes
- **Enhanced User Experience**: Fast loading times and streamlined checkout process
- **Service Area Focus**: Specialized coverage for North East, London, West Midlands, Essex, and Peterborough regions

## Technical Stack

- **Frontend**: React with TypeScript, shadcn UI components
- **Backend**: Express.js server
- **Database**: PostgreSQL with Drizzle ORM
- **Payment Processing**: Stripe, PayPal, and Klarna integration
- **State Management**: React Context API and TanStack Query
- **Styling**: Tailwind CSS with custom theme configuration

## System Requirements

- Node.js 18.x or higher
- PostgreSQL 14.x or higher
- npm or yarn package manager

## Environment Variables

The application requires the following environment variables to be set:

```
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/easymovedb

# Payment Providers
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLIC_KEY=pk_test_...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...

# Optional for production
NODE_ENV=production
PORT=5000
```

## Installation and Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables (create a `.env` file based on the example above)
4. Initialize the database:
   ```
   npm run db:push
   ```
5. Start the development server:
   ```
   npm run dev
   ```

## Deployment Process

### Deployment to Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the following configuration:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
4. Add all required environment variables
5. Deploy the application

### Deployment to Another Platform

1. Build the application: `npm run build`
2. Ensure the platform has Node.js 18+ installed
3. Set up environment variables as specified above
4. Start the application using `npm start`

## Payment Integration

### Stripe

The application uses Stripe for credit card payments. The implementation includes:

- Client-side Elements for secure card input
- Server-side payment intent creation
- Webhook handling for payment events

### PayPal

PayPal integration provides an alternative payment method:

- Enhanced PayPal button component
- Background token caching for fast initialization
- Robust error handling and retry logic

### Klarna

Klarna integration allows for "buy now, pay later" functionality:

- Klarna Checkout integration
- Session-based payment flow
- Redirect handling for completion

## Performance Optimizations

- **Token Caching**: Pre-fetches payment provider tokens to reduce checkout initialization time
- **Asset Optimization**: Pre-generated SVG assets for vehicle types
- **Lazy Loading**: Components and routes loaded on demand
- **Database Indexing**: Optimized database queries for fast pricing calculations

## Maintenance and Troubleshooting

### Common Issues

1. **Payment 404 Errors**: Ensure all API routes are properly registered in `server/routes.ts`
2. **Database Connection Issues**: Verify DATABASE_URL is correct and the database is running
3. **Payment Initialization Delays**: Check network connectivity to payment provider APIs

### Monitoring

- Application logs provide detailed information about payment processing
- Performance metrics track API response times and user interactions

## Future Enhancements

- Driver mobile application for real-time tracking
- Advanced booking management system
- Machine learning-based price optimization
- Customer loyalty program
- Regional expansion beyond current service areas

## Security Considerations

- All payment credentials are securely handled through environment variables
- No sensitive data is stored in client-side code
- HTTPS is enforced for all communication
- Database connection uses parameterized queries to prevent SQL injection

---

For additional support or feature requests, please contact the development team.