#!/usr/bin/env node

/**
 * EasyMove Man and Van Payment Fix Tool
 * 
 * Interactive CLI tool to diagnose and fix common payment provider issues
 * before deployment to Render or other hosting platforms.
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const config = require('./payment-debug-config');
const { runDiagnostics } = require('./payment-diagnostics');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function mainMenu() {
  console.clear();
  console.log('\n====== EASYMOVE PAYMENT FIX TOOL ======');
  console.log('1. Run payment diagnostics');
  console.log('2. Check/fix environment variables');
  console.log('3. Test Stripe connectivity');
  console.log('4. Test PayPal connectivity');
  console.log('5. Fix common payment issues');
  console.log('6. Prepare for deployment');
  console.log('7. Exit');
  
  rl.question('\nSelect an option (1-7): ', (answer) => {
    switch(answer) {
      case '1':
        runDiagnostics().then(() => {
          pressEnterToContinue();
        });
        break;
      case '2':
        checkEnvironmentVariables();
        break;
      case '3':
        testStripeConnectivity();
        break;
      case '4':
        testPayPalConnectivity();
        break;
      case '5':
        fixCommonIssuesMenu();
        break;
      case '6':
        prepareForDeployment();
        break;
      case '7':
        console.log('Exiting payment fix tool. Goodbye!');
        rl.close();
        break;
      default:
        console.log('Invalid option. Please try again.');
        pressEnterToContinue();
    }
  });
}

function checkEnvironmentVariables() {
  console.clear();
  console.log('\n====== ENVIRONMENT VARIABLES CHECKER ======');
  
  // Check if .env file exists
  const envPath = path.join(process.cwd(), '.env');
  let envVars = {};
  
  if (fs.existsSync(envPath)) {
    console.log('Found .env file. Checking variables...');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Parse .env file
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const [, key, value] = match;
        envVars[key.trim()] = value.trim();
      }
    });
  } else {
    console.log('No .env file found. Would you like to create one? (y/n)');
    rl.question('', (answer) => {
      if (answer.toLowerCase() === 'y') {
        createEnvFile();
      } else {
        pressEnterToContinue();
      }
    });
    return;
  }
  
  // Check Stripe variables
  console.log('\nStripe Configuration:');
  checkEnvVar(envVars, 'VITE_STRIPE_PUBLIC_KEY', 'pk_');
  checkEnvVar(envVars, 'STRIPE_SECRET_KEY', 'sk_');
  checkEnvVar(envVars, 'STRIPE_WEBHOOK_SECRET', 'whsec_');
  
  // Check PayPal variables
  console.log('\nPayPal Configuration:');
  checkEnvVar(envVars, 'PAYPAL_CLIENT_ID');
  checkEnvVar(envVars, 'PAYPAL_CLIENT_SECRET');
  
  rl.question('\nWould you like to update any of these variables? (y/n) ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      updateEnvVariable(envVars);
    } else {
      pressEnterToContinue();
    }
  });
}

function checkEnvVar(envVars, name, prefix = null) {
  const value = envVars[name];
  if (!value) {
    console.log(`- ${name}: ✗ Missing`);
    return false;
  }
  
  if (prefix && !value.startsWith(prefix)) {
    console.log(`- ${name}: ⚠️ Invalid format (should start with ${prefix})`);
    return false;
  }
  
  console.log(`- ${name}: ✓ Set`);
  return true;
}

function createEnvFile() {
  console.log('\nCreating .env file with template values...');
  
  const envContent = `# Stripe Configuration
VITE_STRIPE_PUBLIC_KEY=pk_test_
STRIPE_SECRET_KEY=sk_test_
STRIPE_WEBHOOK_SECRET=whsec_

# PayPal Configuration
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
`;
  
  const envPath = path.join(process.cwd(), '.env');
  fs.writeFileSync(envPath, envContent);
  
  console.log('Created .env file. Please update with your actual values.');
  pressEnterToContinue();
}

function updateEnvVariable(currentVars) {
  console.clear();
  console.log('\n====== UPDATE ENVIRONMENT VARIABLES ======');
  console.log('Which variable would you like to update?');
  console.log('1. VITE_STRIPE_PUBLIC_KEY');
  console.log('2. STRIPE_SECRET_KEY');
  console.log('3. STRIPE_WEBHOOK_SECRET');
  console.log('4. PAYPAL_CLIENT_ID');
  console.log('5. PAYPAL_CLIENT_SECRET');
  console.log('6. Return to main menu');
  
  rl.question('Select an option (1-6): ', (answer) => {
    let varName;
    let prefix;
    
    switch(answer) {
      case '1':
        varName = 'VITE_STRIPE_PUBLIC_KEY';
        prefix = 'pk_';
        break;
      case '2':
        varName = 'STRIPE_SECRET_KEY';
        prefix = 'sk_';
        break;
      case '3':
        varName = 'STRIPE_WEBHOOK_SECRET';
        prefix = 'whsec_';
        break;
      case '4':
        varName = 'PAYPAL_CLIENT_ID';
        break;
      case '5':
        varName = 'PAYPAL_CLIENT_SECRET';
        break;
      case '6':
        mainMenu();
        return;
      default:
        console.log('Invalid option. Please try again.');
        updateEnvVariable(currentVars);
        return;
    }
    
    rl.question(`Enter new value for ${varName}: `, (value) => {
      if (prefix && !value.startsWith(prefix)) {
        console.log(`Warning: Value should start with ${prefix}`);
        rl.question('Continue anyway? (y/n): ', (cont) => {
          if (cont.toLowerCase() === 'y') {
            saveEnvVariable(currentVars, varName, value);
          } else {
            updateEnvVariable(currentVars);
          }
        });
      } else {
        saveEnvVariable(currentVars, varName, value);
      }
    });
  });
}

function saveEnvVariable(currentVars, name, value) {
  currentVars[name] = value;
  
  // Write back to .env file
  const envPath = path.join(process.cwd(), '.env');
  let envContent = '';
  
  Object.keys(currentVars).forEach(key => {
    envContent += `${key}=${currentVars[key]}\n`;
  });
  
  fs.writeFileSync(envPath, envContent);
  console.log(`Updated ${name} successfully.`);
  
  rl.question('Would you like to update another variable? (y/n) ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      updateEnvVariable(currentVars);
    } else {
      mainMenu();
    }
  });
}

function testStripeConnectivity() {
  console.clear();
  console.log('\n====== TESTING STRIPE CONNECTIVITY ======');
  console.log('Running simple test with current Stripe configuration...');
  
  // For simplicity, we'll use the diagnostics module
  const { testStripeConnectivity } = require('./payment-diagnostics');
  testStripeConnectivity().then(() => {
    pressEnterToContinue();
  });
}

function testPayPalConnectivity() {
  console.clear();
  console.log('\n====== TESTING PAYPAL CONNECTIVITY ======');
  console.log('Running simple test with current PayPal configuration...');
  
  // For simplicity, we'll use the diagnostics module
  const { testPayPalConnectivity } = require('./payment-diagnostics');
  testPayPalConnectivity().then(() => {
    pressEnterToContinue();
  });
}

function fixCommonIssuesMenu() {
  console.clear();
  console.log('\n====== FIX COMMON PAYMENT ISSUES ======');
  console.log('1. Fix Stripe key format issues');
  console.log('2. Fix PayPal SDK loading issues');
  console.log('3. Create test payment intent');
  console.log('4. Fix API route conflicts');
  console.log('5. Return to main menu');
  
  rl.question('\nSelect an option (1-5): ', (answer) => {
    switch(answer) {
      case '1':
        fixStripeKeyIssues();
        break;
      case '2':
        fixPayPalSDKIssues();
        break;
      case '3':
        createTestPayment();
        break;
      case '4':
        fixAPIRouteConflicts();
        break;
      case '5':
        mainMenu();
        break;
      default:
        console.log('Invalid option. Please try again.');
        pressEnterToContinue(() => fixCommonIssuesMenu());
    }
  });
}

function fixStripeKeyIssues() {
  console.clear();
  console.log('\n====== FIX STRIPE KEY ISSUES ======');
  
  // Read .env file
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.log('No .env file found. Creating one first...');
    createEnvFile();
    return;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  let envVars = {};
  
  // Parse .env file
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      envVars[key.trim()] = value.trim();
    }
  });
  
  const publicKey = envVars['VITE_STRIPE_PUBLIC_KEY'];
  const secretKey = envVars['STRIPE_SECRET_KEY'];
  
  let needsFix = false;
  
  // Check if keys are swapped
  if (publicKey && secretKey) {
    if (publicKey.startsWith('sk_') && secretKey.startsWith('pk_')) {
      console.log('Detected swapped Stripe keys! Would you like to fix this? (y/n)');
      needsFix = true;
      
      rl.question('', (answer) => {
        if (answer.toLowerCase() === 'y') {
          // Swap the keys
          envVars['VITE_STRIPE_PUBLIC_KEY'] = secretKey;
          envVars['STRIPE_SECRET_KEY'] = publicKey;
          
          // Write back to .env
          let newEnvContent = '';
          Object.keys(envVars).forEach(key => {
            newEnvContent += `${key}=${envVars[key]}\n`;
          });
          
          fs.writeFileSync(envPath, newEnvContent);
          console.log('Keys swapped successfully!');
        }
        pressEnterToContinue();
      });
      return;
    }
  }
  
  // Check if keys have correct format
  if (publicKey && !publicKey.startsWith('pk_')) {
    console.log(`Public key has incorrect format: ${publicKey}`);
    console.log('Public key should start with pk_test_ or pk_live_');
    needsFix = true;
  }
  
  if (secretKey && !secretKey.startsWith('sk_')) {
    console.log(`Secret key has incorrect format: ${secretKey}`);
    console.log('Secret key should start with sk_test_ or sk_live_');
    needsFix = true;
  }
  
  if (!needsFix) {
    console.log('No Stripe key format issues detected.');
  }
  
  pressEnterToContinue();
}

function fixPayPalSDKIssues() {
  console.clear();
  console.log('\n====== FIX PAYPAL SDK ISSUES ======');
  console.log('Common PayPal SDK issues:');
  console.log('1. Script loading failure');
  console.log('2. Button rendering issues');
  console.log('3. Authentication problems');
  
  console.log('\nChecking for PayPal component files...');
  
  // Check for PayPal button component
  const paypalComponentPath = path.join(process.cwd(), 'client/src/components/PayPalButton.tsx');
  if (fs.existsSync(paypalComponentPath)) {
    console.log('✓ Found PayPal button component');
    
    // Check if component has correct imports and structure
    const content = fs.readFileSync(paypalComponentPath, 'utf8');
    
    if (!content.includes('paypal-button')) {
      console.log('⚠️ PayPal button component might be missing required elements');
      console.log('Suggestion: Check the blueprint documentation for the correct component structure');
    }
  } else {
    console.log('✗ PayPal button component not found');
    console.log('Suggestion: Create the component based on the blueprint');
  }
  
  // Check server routes
  const routesPath = path.join(process.cwd(), 'server/routes.ts');
  if (fs.existsSync(routesPath)) {
    const routesContent = fs.readFileSync(routesPath, 'utf8');
    
    if (!routesContent.includes('/api/paypal/setup') || 
        !routesContent.includes('/api/paypal/order') ||
        !routesContent.includes('capture')) {
      console.log('⚠️ PayPal routes might be missing or incorrectly configured');
      console.log('Suggestion: Add the required PayPal endpoints to routes.ts');
    } else {
      console.log('✓ PayPal routes found in the server code');
    }
  }
  
  pressEnterToContinue();
}

function createTestPayment() {
  console.clear();
  console.log('\n====== CREATE TEST PAYMENT ======');
  console.log('This will create a test payment intent with Stripe to verify your setup.');
  
  rl.question('Enter amount for test payment (in GBP): ', (amount) => {
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      console.log('Invalid amount. Please enter a positive number.');
      pressEnterToContinue(() => createTestPayment());
      return;
    }
    
    console.log(`Creating test payment intent for £${numAmount.toFixed(2)}...`);
    
    // Use curl to call the API endpoint
    const curlCommand = `curl -X POST http://localhost:5000/api/create-payment-intent \
      -H "Content-Type: application/json" \
      -d '{"amount": ${numAmount}}'`;
    
    console.log('\nExecuting request:');
    console.log(curlCommand);
    
    exec(curlCommand, (error, stdout, stderr) => {
      if (error) {
        console.log('Failed to create test payment:');
        console.log(error.message);
      } else if (stderr) {
        console.log('Error output:');
        console.log(stderr);
      } else {
        console.log('\nResponse:');
        console.log(stdout);
        
        try {
          const response = JSON.parse(stdout);
          if (response.clientSecret) {
            console.log('\n✓ Successfully created test payment intent!');
            console.log(`Client secret: ${response.clientSecret.substring(0, 10)}...`);
          }
        } catch (e) {
          console.log('Could not parse response as JSON');
        }
      }
      
      pressEnterToContinue();
    });
  });
}

function fixAPIRouteConflicts() {
  console.clear();
  console.log('\n====== FIX API ROUTE CONFLICTS ======');
  console.log('Checking routes configuration...');
  
  const routesPath = path.join(process.cwd(), 'server/routes.ts');
  if (fs.existsSync(routesPath)) {
    const content = fs.readFileSync(routesPath, 'utf8');
    
    // Extract all route definitions
    const routes = [];
    const routeRegex = /app\.(get|post|put|delete)\(['"]([^'"]+)['"].*\)/g;
    let match;
    
    while ((match = routeRegex.exec(content)) !== null) {
      routes.push({
        method: match[1].toUpperCase(),
        path: match[2]
      });
    }
    
    // Look for duplicates
    const routeMap = new Map();
    const duplicates = [];
    
    routes.forEach(route => {
      const key = `${route.method}:${route.path}`;
      if (routeMap.has(key)) {
        duplicates.push(key);
      } else {
        routeMap.set(key, route);
      }
    });
    
    if (duplicates.length > 0) {
      console.log('Found duplicate route definitions:');
      duplicates.forEach(dup => console.log(`- ${dup}`));
      console.log('\nSuggestion: Remove or rename duplicate routes in routes.ts');
    } else {
      console.log('No duplicate routes found.');
    }
    
    // Check for potential path conflicts
    const paymentPaths = routes
      .filter(r => r.path.includes('payment') || r.path.includes('stripe') || r.path.includes('paypal'))
      .map(r => `${r.method} ${r.path}`);
    
    console.log('\nPayment-related API endpoints:');
    paymentPaths.forEach(path => console.log(`- ${path}`));
    
    // Check if we're using /api/ prefix consistently
    const nonApiPrefixed = routes
      .filter(r => !r.path.startsWith('/api/') && 
                 (r.path.includes('payment') || r.path.includes('stripe') || r.path.includes('paypal')));
    
    if (nonApiPrefixed.length > 0) {
      console.log('\n⚠️ Found payment endpoints without /api/ prefix:');
      nonApiPrefixed.forEach(route => console.log(`- ${route.method} ${route.path}`));
      console.log('\nSuggestion: Use consistent /api/ prefix for all API endpoints');
    }
  } else {
    console.log('Routes file not found at server/routes.ts');
  }
  
  pressEnterToContinue();
}

function prepareForDeployment() {
  console.clear();
  console.log('\n====== PREPARE FOR DEPLOYMENT ======');
  console.log('Creating deployment checklist...');
  
  const checklistPath = path.join(process.cwd(), 'deployment-checklist.md');
  const checklistContent = `# EasyMove Payment Deployment Checklist

## Before Deployment

- [ ] Run payment diagnostics tool with no errors
- [ ] Ensure all environment variables are set correctly
- [ ] Test Stripe payments with test cards
- [ ] Test PayPal payments in sandbox
- [ ] Check API routes are working correctly
- [ ] Verify webhook configurations

## Render Configuration

- [ ] Add all environment variables to Render
- [ ] Set NODE_ENV=production
- [ ] Configure correct build command
- [ ] Set up auto-deploy from Git repository
- [ ] Configure domain and HTTPS

## After Deployment

- [ ] Update webhook URLs in Stripe/PayPal dashboards
- [ ] Test live payment flow
- [ ] Check logs for any errors
- [ ] Verify webhook events are being received

## Common Deployment Issues

- CORS errors: Check if your frontend URL is correctly configured
- Missing environment variables: Double-check all required env vars are set
- API 404 errors: Ensure routes match between frontend and backend
- Payment not processing: Verify API keys are for production environment
`;
  
  fs.writeFileSync(checklistPath, checklistContent);
  
  console.log(`Deployment checklist created at: ${checklistPath}`);
  console.log('\nPreparing package.json for deployment...');
  
  // Create or update deployment script in package.json
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Add or update scripts for deployment
      if (!packageJson.scripts) {
        packageJson.scripts = {};
      }
      
      packageJson.scripts['deploy'] = 'NODE_ENV=production node server/index.js';
      packageJson.scripts['deploy:test'] = 'node payment-diagnostics.js && npm run deploy';
      
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log('Updated package.json with deployment scripts');
    }
  } catch (error) {
    console.log(`Failed to update package.json: ${error.message}`);
  }
  
  pressEnterToContinue();
}

function pressEnterToContinue(callback = mainMenu) {
  rl.question('\nPress Enter to continue...', () => {
    callback();
  });
}

// Start the application
mainMenu();
