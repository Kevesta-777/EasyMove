/**
 * EasyMove Man and Van Payment Diagnostics Tool
 * 
 * This script helps troubleshoot payment integration issues by:
 * 1. Checking environment variables
 * 2. Testing API connectivity
 * 3. Verifying webhook configurations
 * 4. Validating payment flow integrity
 */

const config = require('./payment-debug-config');
const axios = require('axios');

const { PAYMENT_PROVIDERS, PAYMENT_CONFIG } = config;

async function runDiagnostics() {
  console.log('\n====== EASYMOVE PAYMENT DIAGNOSTICS TOOL ======');
  console.log('Mode: ' + (process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'DEVELOPMENT'));
  console.log('---------------------------------------');
  
  // Check environment variables
  await checkEnvironmentVariables();
  
  // Test API connectivity
  if (PAYMENT_PROVIDERS.STRIPE.enabled) {
    await testStripeConnectivity();
  }
  
  if (PAYMENT_PROVIDERS.PAYPAL.enabled) {
    await testPayPalConnectivity();
  }
  
  // Check webhook configuration
  await verifyWebhookConfiguration();
  
  console.log('\n====== DIAGNOSTIC SUMMARY ======');
  reportSummary();
  console.log('\nDiagnostics complete. Export this log when seeking support.');
}

async function checkEnvironmentVariables() {
  console.log('\n[1] Checking environment variables...');
  
  // Stripe variables
  if (PAYMENT_PROVIDERS.STRIPE.enabled) {
    const stripePublicKey = config.getStripePublicKey();
    const stripeSecretKey = config.getStripeSecretKey();
    
    console.log(`- STRIPE_PUBLIC_KEY: ${stripePublicKey ? '✓ Found' : '✗ Missing'} ${stripePublicKey && stripePublicKey.startsWith('pk_') ? '(Valid format)' : '(Invalid format)'}`);
    console.log(`- STRIPE_SECRET_KEY: ${stripeSecretKey ? '✓ Found' : '✗ Missing'} ${stripeSecretKey && stripeSecretKey.startsWith('sk_') ? '(Valid format)' : '(Invalid format)'}`);
    
    // Check for potential key swap
    if (stripePublicKey && stripeSecretKey) {
      if (stripePublicKey.startsWith('sk_') || stripeSecretKey.startsWith('pk_')) {
        console.log('  ⚠️ WARNING: Stripe keys appear to be swapped!');
      }
    }
    
    // Check webhook secret if applicable
    const webhookSecret = process.env[PAYMENT_CONFIG.callbacks.webhook_secret_env];
    console.log(`- STRIPE_WEBHOOK_SECRET: ${webhookSecret ? '✓ Found' : '✗ Missing'}`);
  }
  
  // PayPal variables
  if (PAYMENT_PROVIDERS.PAYPAL.enabled) {
    const paypalClientId = config.getPayPalClientId();
    const paypalClientSecret = config.getPayPalClientSecret();
    
    console.log(`- PAYPAL_CLIENT_ID: ${paypalClientId ? '✓ Found' : '✗ Missing'}`);
    console.log(`- PAYPAL_CLIENT_SECRET: ${paypalClientSecret ? '✓ Found' : '✗ Missing'}`);
  }
}

async function testStripeConnectivity() {
  console.log('\n[2] Testing Stripe API connectivity...');
  
  const stripeSecretKey = config.getStripeSecretKey();
  if (!stripeSecretKey) {
    console.log('  ✗ Unable to test: Missing Stripe secret key');
    return;
  }
  
  try {
    // Try to connect to Stripe API
    const response = await axios.get('https://api.stripe.com/v1/account', {
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    if (response.status === 200) {
      console.log('  ✓ Successfully connected to Stripe API');
      console.log(`  - Account: ${response.data.display_name || response.data.id}`);
      console.log(`  - Account type: ${response.data.type}`);
      console.log(`  - Country: ${response.data.country}`);
      console.log(`  - Mode: ${stripeSecretKey.includes('_test_') ? 'TEST' : 'LIVE'}`);
    }
  } catch (error) {
    console.log('  ✗ Failed to connect to Stripe API');
    console.log('  - Error:', error.response?.data?.error?.message || error.message);
    
    // Suggest possible solutions
    if (error.response?.data?.error?.type === 'invalid_request_error') {
      console.log('  - Possible fix: Check if your API keys are valid and have not expired');
    } else if (error.response?.data?.error?.type === 'authentication_error') {
      console.log('  - Possible fix: Verify that your secret key is correct');
    }
  }
}

async function testPayPalConnectivity() {
  console.log('\n[3] Testing PayPal API connectivity...');
  
  const clientId = config.getPayPalClientId();
  const clientSecret = config.getPayPalClientSecret();
  
  if (!clientId || !clientSecret) {
    console.log('  ✗ Unable to test: Missing PayPal credentials');
    return;
  }
  
  try {
    // Get PayPal OAuth token
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await axios.post(
      'https://api-m.sandbox.paypal.com/v1/oauth2/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    if (response.status === 200 && response.data.access_token) {
      console.log('  ✓ Successfully authenticated with PayPal API');
      console.log(`  - Token expires in: ${response.data.expires_in} seconds`);
      console.log(`  - App name: ${response.data.app_id || 'Not available'}`);
      console.log(`  - Mode: ${PAYMENT_PROVIDERS.PAYPAL.sandbox ? 'SANDBOX' : 'LIVE'}`);
    }
  } catch (error) {
    console.log('  ✗ Failed to connect to PayPal API');
    console.log('  - Error:', error.response?.data?.error_description || error.message);
    
    // Suggest possible solutions
    if (error.response?.data?.error === 'invalid_client') {
      console.log('  - Possible fix: Verify your PayPal client ID and secret');
    } else if (error.response?.status === 401) {
      console.log('  - Possible fix: Check if your credentials have the correct permissions');
    }
  }
}

async function verifyWebhookConfiguration() {
  console.log('\n[4] Checking webhook configuration...');
  
  // Stripe webhook check
  if (PAYMENT_PROVIDERS.STRIPE.enabled) {
    const stripeSecretKey = config.getStripeSecretKey();
    const webhookUrl = PAYMENT_PROVIDERS.STRIPE.endpoints.webhook;
    
    if (!stripeSecretKey) {
      console.log('  ✗ Unable to verify Stripe webhooks: Missing secret key');
    } else {
      console.log(`  - Stripe webhook endpoint: ${webhookUrl}`);
      
      try {
        // Try to list webhooks
        const response = await axios.get('https://api.stripe.com/v1/webhook_endpoints', {
          headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
        
        if (response.status === 200) {
          const webhooks = response.data.data;
          const relevantWebhooks = webhooks.filter(hook => 
            hook.url.includes(webhookUrl) || 
            hook.url.includes(process.env.DOMAIN || 'localhost')
          );
          
          if (relevantWebhooks.length > 0) {
            console.log('  ✓ Found configured webhook endpoints:');
            relevantWebhooks.forEach(hook => {
              console.log(`    - URL: ${hook.url}`);
              console.log(`      Events: ${hook.enabled_events.join(', ')}`);
              console.log(`      Status: ${hook.status}`);
            });
          } else {
            console.log('  ⚠️ No relevant webhook endpoints found for your domain');
            console.log('  - Suggestion: Configure webhooks in the Stripe dashboard');
          }
        }
      } catch (error) {
        console.log('  ✗ Failed to retrieve webhook configurations');
        console.log('  - Error:', error.response?.data?.error?.message || error.message);
      }
    }
  }
  
  // PayPal webhook check - Basic URL validation
  if (PAYMENT_PROVIDERS.PAYPAL.enabled) {
    console.log('  - PayPal webhook configuration not available in diagnostic tool');
    console.log('  - Suggestion: Verify webhooks in the PayPal Developer Dashboard');
  }
}

function reportSummary() {
  // This would be filled out with results from the tests above
  console.log('Configuration issues detected:');
  // Example output based on previous test results
  // This would be dynamically populated in a real implementation
  console.log('- Review the detailed output above for specific issues');
}

// Make it runnable both as a module and standalone script
if (require.main === module) {
  runDiagnostics().catch(error => {
    console.error('Diagnostic tool encountered an error:', error);
  });
}

module.exports = {
  runDiagnostics
};
