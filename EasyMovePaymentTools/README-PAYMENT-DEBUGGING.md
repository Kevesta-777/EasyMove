# EasyMove Man and Van - Payment Debugging Tools

## Overview

This repository contains tools to configure, test, and debug payment integrations for the EasyMove Man and Van application before deployment to Render or other hosting platforms. It includes utilities for Stripe and PayPal payment processing.

## Files

### 1. `payment-debug-config.js`

Centralized configuration for payment providers with environment variable mappings, endpoint definitions, and helper functions.

```js
const config = require('./payment-debug-config');

// Get configuration values
const stripePublicKey = config.getStripePublicKey();
const depositAmount = config.calculateDeposit(1000); // £250
```

### 2. `payment-diagnostics.js`

Tool to verify payment provider setup and diagnose common issues.

```bash
# Run diagnostics
node payment-diagnostics.js
```

## Setup Instructions

### Environment Variables

Create a `.env` file with the following variables:

```
# Stripe Configuration
VITE_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
```

### Stripe Test Cards

Use these test cards for Stripe:

- **Success**: 4242 4242 4242 4242
- **Authentication**: 4000 0025 0000 3155
- **Decline**: 4000 0000 0000 0002

### PayPal Sandbox

Use the PayPal Developer Dashboard to create sandbox accounts for testing.

## Common Issues & Solutions

### 1. Client/Secret Key Mismatch

**Symptom**: Error message `The client_secret provided does not match any associated PaymentIntent on this account`

**Solution**: 
- Check if your public and secret keys belong to the same Stripe account
- Ensure keys are not swapped (public should start with `pk_`, secret with `sk_`)

### 2. Webhook Failure

**Symptom**: Payment completes but confirmation doesn't update

**Solution**:
- Verify webhook URL is accessible from Stripe/PayPal
- Check webhook secret is correctly configured
- Examine webhook event logs in provider dashboards

### 3. PayPal Integration Issues

**Symptom**: PayPal button doesn't appear or fails to load

**Solution**:
- Ensure PayPal SDK is loading correctly
- Verify client ID and secret are correct
- Check that server routes are properly configured

## Render Deployment Notes

1. Add all environment variables to Render environment settings
2. Update webhook endpoints to your production URL
3. Configure proper CORS settings
4. Set `NODE_ENV=production` to disable sandbox/test mode

## API Testing

Test your payment endpoints with curl:

```bash
# Test Stripe payment intent creation
curl -X POST http://localhost:5000/api/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000}'

# Test PayPal order creation
curl -X POST http://localhost:5000/api/paypal/order \
  -H "Content-Type: application/json" \
  -d '{"amount": "10.00", "currency": "GBP", "intent": "CAPTURE"}'
```

## Support

For technical assistance, please provide the diagnostic output when contacting support.
