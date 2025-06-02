# EasyMove Platform - Complete Deployment Checklist

## Required API Keys for Production

Before deploying, you need to obtain these API keys for your external services:

### 1. Stripe Payment Processing
To enable secure payments, you'll need production Stripe keys:
- Visit: https://dashboard.stripe.com/apikeys
- Copy your "Publishable key" (starts with `pk_live_`)
- Copy your "Secret key" (starts with `sk_live_`)

### 2. PayPal Payment Integration  
For PayPal payment options, you'll need production credentials:
- Visit: https://developer.paypal.com/developer/applications/
- Create a production application
- Copy the Client ID and Client Secret

### 3. Google Maps Distance Calculation
For accurate distance and location services:
- Visit: https://console.cloud.google.com/google/maps-apis/
- Enable these APIs: Distance Matrix API, Maps JavaScript API, Geocoding API
- Create an API key with appropriate restrictions

## Render Deployment Steps

### Step 1: Repository Setup
1. Push your complete EasyMove code to GitHub
2. Ensure all files from the deployment package are included

### Step 2: Create Render Service
1. Connect your GitHub repository to Render
2. Create a new Web Service with these settings:
   - Name: `easymove-platform`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

### Step 3: Database Configuration
1. Create a PostgreSQL database in Render:
   - Name: `easymove-postgres`
   - Database: `easymove_production`
   - User: `easymove_user`

### Step 4: Environment Variables
Add these in your Render dashboard:

```
NODE_ENV=production
PORT=10000
DATABASE_URL=[automatically provided]
STRIPE_SECRET_KEY=[your production secret key]
VITE_STRIPE_PUBLIC_KEY=[your production public key]
PAYPAL_CLIENT_ID=[your production client ID]
PAYPAL_CLIENT_SECRET=[your production client secret]
GOOGLE_MAPS_API_KEY=[your maps API key]
```

## Admin Portal Configuration

Your admin system will be accessible at:
- URL: `https://your-app-name.onrender.com/admin/login`
- Default credentials: `manager@easymove.com` / `secure2025`

The admin portal connects directly to your production database to display:
- Real booking statistics and revenue data
- Actual driver applications requiring approval
- Live user registration metrics
- Current system health status

## Post-Deployment Verification

After deployment, verify these features work correctly:

1. **Customer Quote System**: Test distance calculation and pricing
2. **Payment Processing**: Verify both Stripe and PayPal work with real transactions
3. **Admin Dashboard**: Confirm real data appears from your database
4. **Driver Management**: Test the approval workflow
5. **Database Operations**: Ensure all bookings save correctly

## Production Readiness

Your platform includes:
- Secure admin authentication system
- Real-time database integration
- Production payment processing
- Professional distance calculation
- Complete booking management system

The deployment package contains all necessary code files and configurations for a fully functional man and van transport platform ready for commercial use.