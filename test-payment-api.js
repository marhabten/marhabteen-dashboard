#!/usr/bin/env node

/**
 * Payment API Test Suite
 *
 * Tests the payment initiation and verification endpoints
 * Run with: node test-payment-api.js
 */

// Import fetch for Node.js versions < 18
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

function logTest(name) {
  console.log(`\n${colors.blue}${colors.bold}━━━ ${name} ━━━${colors.reset}`);
}

function logPass(msg) {
  log(colors.green, '✓', msg);
}

function logFail(msg) {
  log(colors.red, '✗', msg);
}

function logInfo(msg) {
  log(colors.yellow, 'ℹ', msg);
}

let testsPassed = 0;
let testsFailed = 0;

async function testEndpoint(name, url, options = {}, expectations = {}) {
  logTest(name);

  try {
    logInfo(`Requesting: ${options.method || 'GET'} ${url}`);

    if (options.body) {
      logInfo(`Body: ${JSON.stringify(options.body, null, 2)}`);
    }

    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const data = await response.json().catch(() => ({}));

    logInfo(`Status: ${response.status}`);
    logInfo(`Response: ${JSON.stringify(data, null, 2)}`);

    // Check status code
    if (expectations.status) {
      if (response.status === expectations.status) {
        logPass(`Status code is ${expectations.status}`);
        testsPassed++;
      } else {
        logFail(`Expected status ${expectations.status}, got ${response.status}`);
        testsFailed++;
      }
    }

    // Check response fields
    if (expectations.fields) {
      for (const field of expectations.fields) {
        if (field in data) {
          logPass(`Response contains field: ${field}`);
          testsPassed++;
        } else {
          logFail(`Response missing field: ${field}`);
          testsFailed++;
        }
      }
    }

    // Check response values
    if (expectations.values) {
      for (const [key, value] of Object.entries(expectations.values)) {
        if (data[key] === value) {
          logPass(`${key} = ${value}`);
          testsPassed++;
        } else {
          logFail(`Expected ${key} = ${value}, got ${data[key]}`);
          testsFailed++;
        }
      }
    }

    return { success: true, data, response };

  } catch (error) {
    logFail(`Request failed: ${error.message}`);
    testsFailed++;
    return { success: false, error };
  }
}

async function runTests() {
  console.log(`${colors.bold}🧪 Payment API Test Suite${colors.reset}`);
  console.log(`Testing against: ${BASE_URL}\n`);

  // Test 1: Payment Initiate - Missing fields
  await testEndpoint(
    'Test 1: Payment Initiate - Missing Required Fields',
    `${BASE_URL}/api/payment/initiate`,
    {
      method: 'POST',
      body: {},
    },
    {
      status: 400,
      fields: ['error'],
    }
  );

  // Test 2: Payment Initiate - Invalid amount
  await testEndpoint(
    'Test 2: Payment Initiate - Invalid Amount (negative)',
    `${BASE_URL}/api/payment/initiate`,
    {
      method: 'POST',
      body: {
        bookingId: 'test-booking-123',
        amount: -100,
        email: 'test@example.com',
      },
    },
    {
      status: 400,
      fields: ['error'],
    }
  );

  // Test 3: Payment Initiate - Invalid amount (zero)
  await testEndpoint(
    'Test 3: Payment Initiate - Invalid Amount (zero)',
    `${BASE_URL}/api/payment/initiate`,
    {
      method: 'POST',
      body: {
        bookingId: 'test-booking-123',
        amount: 0,
        email: 'test@example.com',
      },
    },
    {
      status: 400,
      fields: ['error'],
    }
  );

  // Test 4: Payment Initiate - Valid request (will fail if env vars not set)
  await testEndpoint(
    'Test 4: Payment Initiate - Valid Request',
    `${BASE_URL}/api/payment/initiate`,
    {
      method: 'POST',
      body: {
        bookingId: 'test-booking-' + Date.now(),
        amount: 100,
        email: 'test@example.com',
        phone: '+1234567890',
      },
    },
    {
      // Will be 200 if configured, 500 if env vars missing
      fields: ['success'],
    }
  );

  // Test 5: Payment Verify - Missing customRef
  await testEndpoint(
    'Test 5: Payment Verify - Missing customRef',
    `${BASE_URL}/api/payment/verify`,
    {
      method: 'POST',
      body: {},
    },
    {
      status: 400,
      fields: ['error'],
    }
  );

  // Test 6: Payment Verify - Valid request with fake ID
  await testEndpoint(
    'Test 6: Payment Verify - Valid Request (fake ID)',
    `${BASE_URL}/api/payment/verify`,
    {
      method: 'POST',
      body: {
        customRef: 'fake-booking-id',
      },
    },
    {
      // Will return 200 even if verification fails
      status: 200,
      fields: ['success', 'verified'],
    }
  );

  // Test 7: Check if server is running
  logTest('Test 7: Server Health Check');
  try {
    const response = await fetch(BASE_URL);
    if (response.ok || response.status === 404) {
      logPass('Server is running');
      testsPassed++;
    } else {
      logFail(`Server returned unexpected status: ${response.status}`);
      testsFailed++;
    }
  } catch (error) {
    logFail(`Server is not accessible: ${error.message}`);
    logInfo('Make sure your Next.js server is running with: npm run dev');
    testsFailed++;
  }

  // Summary
  console.log(`\n${colors.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bold}Test Summary${colors.reset}`);
  console.log(`${colors.green}Passed: ${testsPassed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testsFailed}${colors.reset}`);
  console.log(`Total: ${testsPassed + testsFailed}`);

  if (testsFailed === 0) {
    console.log(`\n${colors.green}${colors.bold}✓ All tests passed!${colors.reset}`);
  } else {
    console.log(`\n${colors.red}${colors.bold}✗ Some tests failed${colors.reset}`);
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
