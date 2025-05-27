# EasyMove Man and Van - Deployment Package

This repository contains deployment and payment debugging tools for the EasyMove Man and Van application.

## Deployment Files

- `render.yaml` - Configuration for deploying to Render
- `.env.example` - Template for required environment variables
- `payment-tools.sh` - Script to run payment debugging tools

## Payment Debugging Tools

- `payment-debug-config.js` - Central configuration for payment providers
- `payment-diagnostics.js` - Tool to analyze payment provider setup
- `payment-fix.js` - Interactive tool to fix common payment issues
- `README-PAYMENT-DEBUGGING.md` - Detailed usage guide

## How to Use

1. Clone this repository
2. Copy the files to your EasyMove Man and Van project
3. Create a `.env` file with your Stripe and PayPal API keys
4. Run the payment debugging tools before deployment:
   ```
   ./payment-tools.sh diagnose
   ```
5. Deploy to Render using the provided configuration

## Common Deployment Issues

See `README-PAYMENT-DEBUGGING.md` for a comprehensive guide to resolving common payment integration issues before deployment.
