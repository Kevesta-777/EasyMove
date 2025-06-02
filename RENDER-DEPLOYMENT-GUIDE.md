# EasyMove Platform - Complete Render Deployment Guide

## Step 1: Environment Variables Setup

Before deploying to Render, you'll need to obtain and configure these API keys:

### Required API Keys and Secrets

#### 1. Stripe Payment Keys
- **Purpose**: Process customer payments
- **Where to get them**: https://dashboard.stripe.com/apikeys
- **What you need**:
  - `STRIPE_SECRET_KEY` (starts with `sk_live_` for production)
  - `VITE_STRIPE_PUBLIC_KEY` (starts with `pk_live_` for production)

#### 2. PayPal API Credentials
- **Purpose**: Alternative payment processing
- **Where to get them**: https://developer.paypal.com/developer/applications/
- **What you need**:
  - `PAYPAL_CLIENT_ID` (production environment)
  - `PAYPAL_CLIENT_SECRET` (production environment)

#### 3. Google Maps API Key
- **Purpose**: Distance calculation and location services
- **Where to get it**: https://console.cloud.google.com/google/maps-apis/
- **What you need**:
  - `GOOGLE_MAPS_API_KEY` with enabled APIs:
    - Distance Matrix API
    - Maps JavaScript API
    - Geocoding API

## Step 2: Render Dashboard Configuration

### Creating Your Service

1. **Connect Repository**
   - Connect your GitHub repository to Render
   - Select the repository containing your EasyMove code

2. **Configure Service Settings**
   ```
   Name: easymove-platform
   Environment: Node
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

3. **Add Environment Variables**
   In your Render dashboard, add these environment variables:

   ```bash
   NODE_ENV=production
   PORT=10000
   
   # Database (auto-configured by Render)
   DATABASE_URL=[automatically provided by Render PostgreSQL]
   
   # Stripe Configuration
   STRIPE_SECRET_KEY=sk_live_[your_stripe_secret_key]
   VITE_STRIPE_PUBLIC_KEY=pk_live_[your_stripe_public_key]
   
   # PayPal Configuration
   PAYPAL_CLIENT_ID=[your_paypal_client_id]
   PAYPAL_CLIENT_SECRET=[your_paypal_client_secret]
   
   # Google Maps
   GOOGLE_MAPS_API_KEY=[your_google_maps_api_key]
   ```

### Creating PostgreSQL Database

1. **Add Database Service**
   - In Render dashboard, create new PostgreSQL database
   - Name: `easymove-postgres`
   - Plan: Starter (or higher based on needs)

2. **Database Configuration**
   ```
   Database Name: easymove_production
   User: easymove_user
   ```

## Step 3: Pre-Deployment Checklist

### Code Preparation
- [ ] All admin portal files are in place
- [ ] Backend API routes are configured
- [ ] Database schema is complete
- [ ] Payment integration is ready
- [ ] Environment variables are configured

### API Keys Status
- [ ] Stripe keys obtained and added to Render
- [ ] PayPal credentials obtained and added to Render  
- [ ] Google Maps API key obtained and added to Render
- [ ] All API keys are production-ready (not test keys)

### Database Setup
- [ ] PostgreSQL database created in Render
- [ ] Database URL configured in environment variables
- [ ] Schema migration ready to run

## Step 4: Deployment Process

### Automatic Deployment
1. Push your code to the connected GitHub repository
2. Render will automatically:
   - Install dependencies (`npm install`)
   - Build the application (`npm run build`)
   - Start the production server (`npm start`)
   - Run database migrations

### Manual Deployment
If you need to deploy manually:
1. Go to Render dashboard
2. Select your service
3. Click "Manual Deploy"
4. Choose the branch to deploy

## Step 5: Post-Deployment Verification

### 1. Check Application Health
- Visit your deployed URL (provided by Render)
- Verify the home page loads correctly
- Test the quote calculation functionality

### 2. Test Admin Portal
- Navigate to `[your-domain]/admin/login`
- Login with credentials: `manager@easymove.com` / `secure2025`
- Verify dashboard shows real data from database
- Test driver approval functionality

### 3. Test Payment Processing
- Create a test booking
- Verify Stripe payment integration works
- Test PayPal payment flow
- Confirm payments are processed correctly

### 4. Verify Database Connection
- Check that bookings are saved to database
- Verify user registration works
- Test driver application submissions

## Step 6: Admin Portal Access

### Default Admin Credentials
```
Email: manager@easymove.com
Password: secure2025

Backup Admin:
Email: admin@easymove.com  
Password: admin123
```

### Admin Portal Features
- **Dashboard**: Business metrics and real-time data
- **Booking Management**: View and update all customer bookings
- **Driver Verification**: Approve/reject driver applications
- **User Management**: Monitor customer accounts
- **System Health**: Monitor platform performance

### Admin URLs
- Production: `https://[your-render-domain]/admin/login`
- Local Development: `http://localhost:5000/admin/login`

## Step 7: Troubleshooting Common Issues

### Database Connection Issues
- Verify DATABASE_URL is set correctly
- Check database service is running in Render
- Ensure database migrations completed successfully

### Payment Processing Issues
- Confirm API keys are production keys (not test)
- Verify webhook endpoints are configured (if using)
- Check API key permissions in respective dashboards

### Google Maps Issues
- Ensure API key has required permissions
- Verify billing is enabled in Google Cloud Console
- Check API quotas and limits

## Step 8: Monitoring and Maintenance

### Performance Monitoring
- Monitor response times in Render dashboard
- Check database performance metrics
- Review error logs regularly

### Regular Updates
- Keep dependencies updated
- Monitor security vulnerabilities
- Review and update pricing calculations
- Backup database regularly

## Support and Documentation

### Getting Help
- Render Documentation: https://render.com/docs
- Stripe Documentation: https://stripe.com/docs
- PayPal Developer Docs: https://developer.paypal.com/docs/
- Google Maps API Docs: https://developers.google.com/maps

### Emergency Contacts
- Admin portal provides system health monitoring
- Database backup and recovery procedures available
- Payment processing status dashboard included

Your EasyMove platform is now ready for professional deployment on Render with full admin portal integration, real-time data processing, and secure payment handling.