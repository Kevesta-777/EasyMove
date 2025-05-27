/**
 * EasyMove Man and Van Payment Debug Configuration
 * 
 * This file serves as a central configuration point for payment-related settings
 * for easier debugging and testing before deployment to Render.
 * 
 * Instructions:
 * 1. Update the payment provider configurations as needed
 * 2. Set the appropriate environment variables in your deployment platform
 * 3. Use this file as a reference when setting up your payment providers
 */

// Payment Provider Selection
const PAYMENT_PROVIDERS = {
  STRIPE: {
    enabled: true,
    mode: 'redirect', // 'redirect' or 'embedded'
    sandbox: true,     // Use test mode keys
    env_vars: {
      // Public key should start with 'pk_'
      public_key: 'VITE_STRIPE_PUBLIC_KEY', // Environment variable name
      // Secret key should start with 'sk_'
      secret_key: 'STRIPE_SECRET_KEY',      // Environment variable name
    },
    endpoints: {
      create_payment_intent: '/api/create-payment-intent',
      create_checkout_session: '/api/create-checkout-session',
      webhook: '/api/webhooks/stripe',
    },
    // Fallback test keys (only for development)
    test_keys: {
      public_key: 'pk_test_TYooMQauvdEDq54NiTphI7jx',
      secret_key: 'sk_test_4eC39HqLyjWDarjtT1zdp7dc',
    },
    // Known errors and troubleshooting steps
    common_errors: {
      'invalid_request_error': 'Client and secret keys might be swapped or belong to different accounts',
      'authentication_error': 'API keys may be invalid or expired',
      'card_error': 'Test with Stripe test cards like 4242 4242 4242 4242',
      'api_connection_error': 'Check network connectivity to Stripe API',
    },
  },
  PAYPAL: {
    enabled: true,
    sandbox: true,     // Use sandbox mode
    env_vars: {
      client_id: 'PAYPAL_CLIENT_ID',        // Environment variable name
      client_secret: 'PAYPAL_CLIENT_SECRET', // Environment variable name
    },
    endpoints: {
      setup: '/api/paypal/setup',
      create_order: '/api/paypal/order',
      capture_order: '/api/paypal/order/:orderID/capture',
    },
    // Known errors and troubleshooting steps
    common_errors: {
      'INVALID_CLIENT': 'PayPal client credentials are invalid',
      'INVALID_REQUEST': 'Request format or parameters are incorrect',
      'PERMISSION_DENIED': 'Credentials lack necessary permissions',
      'INTERNAL_SERVER_ERROR': 'Temporary PayPal service issue',
    },
  },
};

// Payment Process Configuration
const PAYMENT_CONFIG = {
  // Pricing and deposit settings
  pricing: {
    vat_rate: 0.20,         // 20% VAT
    deposit_percentage: 0.25, // 25% deposit
    platform_fee_percentage: 0.25, // 25% platform fee (same as deposit)
    driver_share_percentage: 0.75, // 75% driver share
    // Always round deposit amount up to nearest pound
    round_deposit: true,
  },
  
  // Customer information requirements
  customer_info: {
    email_required: false,  // Whether email is mandatory
    phone_optional: true,   // Phone number is optional
    terms_required: true,   // T&C acceptance required
  },
  
  // Webhook and callback configuration
  callbacks: {
    success_redirect: '/booking-confirmation?success=true',
    cancel_redirect: '/checkout',
    webhook_secret_env: 'STRIPE_WEBHOOK_SECRET', // Environment variable name
  },
  
  // Testing and debugging
  debug: {
    log_payment_attempts: true,
    verbose_errors: true,
    simulate_success: false, // For testing success flows without real payments
  },
};

// Export configuration for use in the application
module.exports = {
  PAYMENT_PROVIDERS,
  PAYMENT_CONFIG,
  
  // Helper functions
  getStripePublicKey: () => {
    // Check for proper environment variable first
    const envKey = process.env[PAYMENT_PROVIDERS.STRIPE.env_vars.public_key];
    if (envKey && envKey.startsWith('pk_')) {
      return envKey;
    }
    // Fallback to test key only in development
    if (process.env.NODE_ENV !== 'production' && PAYMENT_PROVIDERS.STRIPE.sandbox) {
      return PAYMENT_PROVIDERS.STRIPE.test_keys.public_key;
    }
    return null;
  },
  
  getStripeSecretKey: () => {
    // Check for proper environment variable first
    const envKey = process.env[PAYMENT_PROVIDERS.STRIPE.env_vars.secret_key];
    if (envKey && envKey.startsWith('sk_')) {
      return envKey;
    }
    // Fallback to test key only in development
    if (process.env.NODE_ENV !== 'production' && PAYMENT_PROVIDERS.STRIPE.sandbox) {
      return PAYMENT_PROVIDERS.STRIPE.test_keys.secret_key;
    }
    return null;
  },
  
  getPayPalClientId: () => {
    return process.env[PAYMENT_PROVIDERS.PAYPAL.env_vars.client_id] || null;
  },
  
  getPayPalClientSecret: () => {
    return process.env[PAYMENT_PROVIDERS.PAYPAL.env_vars.client_secret] || null;
  },
  
  calculateDeposit: (totalAmount) => {
    const depositAmount = totalAmount * PAYMENT_CONFIG.pricing.deposit_percentage;
    return PAYMENT_CONFIG.pricing.round_deposit ? Math.ceil(depositAmount) : depositAmount;
  },
  
  calculateDriverShare: (totalAmount) => {
    const driverShare = totalAmount * PAYMENT_CONFIG.pricing.driver_share_percentage;
    return Math.floor(driverShare * 100) / 100; // Round to 2 decimal places
  },
  
  calculateVAT: (netAmount) => {
    return netAmount * PAYMENT_CONFIG.pricing.vat_rate;
  },
};
