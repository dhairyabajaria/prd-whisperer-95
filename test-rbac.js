#!/usr/bin/env node

/**
 * Comprehensive RBAC Testing Framework
 * Tests role-based access control for the pharmaceutical ERP system
 */

import http from 'http';
import { URL } from 'url';

// Configuration
const API_BASE = 'http://localhost:5000';
const TIMEOUT = 10000;

// Test users by role
const TEST_USERS = {
  admin: { id: 'dev-user-1', email: 'dev@pharma.com', role: 'admin' },
  sales: { id: 'sales-user-1', email: 'sales@pharma.com', role: 'sales' },
  finance: { id: 'finance-user-1', email: 'finance@pharma.com', role: 'finance' },
  hr: { id: 'hr-user-1', email: 'hr@pharma.com', role: 'hr' },
  pos: { id: 'pos-user-1', email: 'pos@pharma.com', role: 'pos' },
  marketing: { id: 'marketing-user-1', email: 'marketing@pharma.com', role: 'marketing' },
  inventory: { id: 'inventory-user-1', email: 'inventory@pharma.com', role: 'inventory' }
};

// RBAC Access Matrix - defines which roles can access which endpoints
const ACCESS_MATRIX = {
  // Dashboard endpoints (all authenticated users)
  'GET /api/dashboard/metrics': ['admin', 'sales', 'finance', 'hr', 'pos', 'marketing', 'inventory'],
  'GET /api/dashboard/transactions': ['admin', 'sales', 'finance', 'hr', 'pos', 'marketing', 'inventory'],
  'GET /api/dashboard/expiring-products': ['admin', 'sales', 'finance', 'hr', 'pos', 'marketing', 'inventory'],
  
  // User endpoints (all authenticated users)
  'GET /api/users': ['admin', 'sales', 'finance', 'hr', 'pos', 'marketing', 'inventory'],
  'GET /api/auth/user': ['admin', 'sales', 'finance', 'hr', 'pos', 'marketing', 'inventory'],
  
  // Customer endpoints (sales and admin)
  'GET /api/customers': ['admin', 'sales'],
  'POST /api/customers': ['admin', 'sales'],
  
  // Supplier endpoints (finance, inventory, admin)
  'GET /api/suppliers': ['admin', 'finance', 'inventory'],
  'POST /api/suppliers': ['admin', 'finance', 'inventory'],
  
  // Product endpoints (most roles need read access)
  'GET /api/products': ['admin', 'sales', 'finance', 'inventory'],
  'POST /api/products': ['admin', 'inventory'],
  
  // Inventory endpoints (inventory and admin primarily)
  'GET /api/inventory': ['admin', 'inventory', 'sales'],
  'POST /api/inventory': ['admin', 'inventory'],
  
  // Sales endpoints (sales and admin)
  'GET /api/sales-orders': ['admin', 'sales'],
  'POST /api/sales-orders': ['admin', 'sales'],
  
  // Purchase endpoints (finance, inventory, admin)
  'GET /api/purchase-orders': ['admin', 'finance', 'inventory'],
  'POST /api/purchase-orders': ['admin', 'finance', 'inventory'],
  
  // Invoice endpoints (finance and admin)
  'GET /api/invoices': ['admin', 'finance'],
  'POST /api/invoices': ['admin', 'finance'],
  
  // POS endpoints (pos, sales, admin)
  'GET /api/pos-terminals': ['admin', 'pos', 'sales'],
  'POST /api/pos-terminals': ['admin', 'pos'],
  'GET /api/pos/sessions': ['admin', 'pos', 'sales'],
  'POST /api/pos/sessions/open': ['admin', 'pos'],
  
  // HR endpoints (hr and admin)
  'GET /api/hr/employees': ['admin', 'hr'],
  'POST /api/hr/employees': ['admin', 'hr'],
  'GET /api/hr/time-entries': ['admin', 'hr'],
  'POST /api/hr/time-entries': ['admin', 'hr'],
  'GET /api/hr/payroll-runs': ['admin', 'hr'],
  'POST /api/hr/payroll-runs': ['admin', 'hr'],
  
  // Finance specific endpoints (finance and admin)
  'GET /api/finance/invoices': ['admin', 'finance'],
  'GET /api/finance/receipts': ['admin', 'finance'],
  'POST /api/finance/receipts': ['admin', 'finance'],
  
  // Marketing endpoints (marketing, sales, admin)
  'GET /api/marketing/campaigns': ['admin', 'marketing', 'sales'],
  'POST /api/marketing/campaigns': ['admin', 'marketing'],
  'GET /api/marketing/leads': ['admin', 'marketing', 'sales'],
  'POST /api/marketing/leads': ['admin', 'marketing', 'sales'],
  
  // Sentiment analysis (marketing, sales, admin)
  'GET /api/sentiment-analysis': ['admin', 'marketing', 'sales'],
  'POST /api/sentiment-analysis': ['admin', 'marketing', 'sales'],
  
  // Purchase requests (finance, inventory, admin)
  'GET /api/purchase-requests': ['admin', 'finance', 'inventory'],
  'POST /api/purchase-requests': ['admin', 'finance', 'inventory'],
  
  // Purchase approvals (finance, admin)
  'POST /api/purchase-requests/:id/approve': ['admin', 'finance'],
  'POST /api/purchase-requests/:id/reject': ['admin', 'finance'],
  
  // Warehouses (inventory, admin)
  'GET /api/warehouses': ['admin', 'inventory'],
  'POST /api/warehouses': ['admin', 'inventory']
};

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  errors: [],
  details: []
};

// HTTP request utility
function makeRequest(method, endpoint, user = null, data = null) {
  return new Promise((resolve, reject) => {
    const fullUrl = `${API_BASE}${endpoint}`;
    const parsedUrl = new URL(fullUrl);
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.pathname + (parsedUrl.search || ''),
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: TIMEOUT
    };

    // Add test user header if specified (we'll need to modify auth middleware to check this)
    if (user) {
      options.headers['X-Test-User-ID'] = user.id;
    }

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: jsonBody,
            rawBody: body
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body,
            rawBody: body,
            parseError: true
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test a single endpoint for a specific user
async function testEndpoint(method, endpoint, user, shouldHaveAccess) {
  try {
    console.log(`\n🧪 Testing ${method} ${endpoint} for ${user.role} (${user.id})`);
    console.log(`   Expected: ${shouldHaveAccess ? '✅ Allow' : '❌ Deny'}`);
    
    const response = await makeRequest(method, endpoint, user);
    const actual = response.status;
    
    let passed = false;
    let message = '';
    
    if (shouldHaveAccess) {
      // Should have access - expect 200, 201, or other success codes
      if (actual >= 200 && actual < 400) {
        passed = true;
        message = `✅ PASS: Got ${actual} (success) as expected`;
      } else if (actual === 401) {
        passed = false;
        message = `❌ FAIL: Got 401 (unauthorized) but user should have access`;
      } else if (actual === 403) {
        passed = false;
        message = `❌ FAIL: Got 403 (forbidden) but user should have access`;
      } else {
        passed = false;
        message = `❌ FAIL: Got ${actual} - unexpected status for authorized access`;
      }
    } else {
      // Should NOT have access - expect 403
      if (actual === 403) {
        passed = true;
        message = `✅ PASS: Got 403 (forbidden) as expected`;
        
        // Check if response is JSON with proper error message
        if (response.body && typeof response.body === 'object' && response.body.message) {
          console.log(`   📄 Error message: "${response.body.message}"`);
        } else {
          console.log(`   ⚠️  Warning: Error response is not proper JSON`);
        }
      } else if (actual === 401) {
        passed = false;
        message = `❌ FAIL: Got 401 (unauthorized) instead of 403 (forbidden)`;
      } else if (actual >= 200 && actual < 400) {
        passed = false;
        message = `❌ FAIL: Got ${actual} (success) but user should be denied access`;
      } else {
        passed = false;
        message = `❌ FAIL: Got ${actual} - expected 403 for denied access`;
      }
    }
    
    console.log(`   ${message}`);
    
    // Store detailed results
    testResults.details.push({
      method,
      endpoint,
      userRole: user.role,
      userId: user.id,
      expectedAccess: shouldHaveAccess,
      actualStatus: actual,
      passed,
      message,
      responseBody: response.body
    });
    
    if (passed) {
      testResults.passed++;
    } else {
      testResults.failed++;
      testResults.errors.push({
        test: `${method} ${endpoint} for ${user.role}`,
        expected: shouldHaveAccess ? 'success (200-399)' : 'forbidden (403)',
        actual: actual,
        message: message
      });
    }
    
  } catch (error) {
    console.log(`   💥 ERROR: ${error.message}`);
    testResults.failed++;
    testResults.errors.push({
      test: `${method} ${endpoint} for ${user.role}`,
      error: error.message
    });
  }
}

// Test all roles against all endpoints
async function runRBACTests() {
  console.log('🚀 Starting Comprehensive RBAC Testing...\n');
  console.log('=' .repeat(60));
  console.log('RBAC TEST MATRIX');
  console.log('=' .repeat(60));
  
  // Check server health first
  console.log('\n🏥 Checking server health...');
  try {
    const health = await makeRequest('GET', '/api/health');
    if (health.status === 200) {
      console.log('✅ Server is healthy');
      console.log(`   Database: ${health.body.databaseConfigured ? '✅' : '❌'}`);
      console.log(`   Session: ${health.body.sessionConfigured ? '✅' : '❌'}`);
      console.log(`   OpenAI: ${health.body.openaiConfigured ? '✅' : '❌'}`);
    } else {
      console.log(`❌ Server health check failed: ${health.status}`);
      return;
    }
  } catch (error) {
    console.log(`💥 Cannot connect to server: ${error.message}`);
    return;
  }
  
  // Test each endpoint for each role
  for (const [endpointKey, allowedRoles] of Object.entries(ACCESS_MATRIX)) {
    const [method, endpoint] = endpointKey.split(' ');
    
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`🎯 TESTING: ${method} ${endpoint}`);
    console.log(`   Allowed roles: ${allowedRoles.join(', ')}`);
    console.log(`${'─'.repeat(80)}`);
    
    // Test each role against this endpoint
    for (const [roleName, user] of Object.entries(TEST_USERS)) {
      const shouldHaveAccess = allowedRoles.includes(roleName);
      await testEndpoint(method, endpoint, user, shouldHaveAccess);
    }
  }
  
  // Generate test report
  generateTestReport();
}

// Generate comprehensive test report
function generateTestReport() {
  console.log('\n\n' + '='.repeat(80));
  console.log('🏁 RBAC TESTING COMPLETE');
  console.log('='.repeat(80));
  
  console.log(`\n📊 SUMMARY:`);
  console.log(`   ✅ Passed: ${testResults.passed}`);
  console.log(`   ❌ Failed: ${testResults.failed}`);
  console.log(`   📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.errors.length > 0) {
    console.log(`\n💥 FAILED TESTS:`);
    testResults.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error.test}`);
      console.log(`      Expected: ${error.expected || 'N/A'}`);
      console.log(`      Actual: ${error.actual || error.error}`);
      if (error.message) {
        console.log(`      Details: ${error.message}`);
      }
      console.log('');
    });
  }
  
  // Role-specific summary
  console.log(`\n👥 ROLE-SPECIFIC RESULTS:`);
  const roleResults = {};
  testResults.details.forEach(detail => {
    if (!roleResults[detail.userRole]) {
      roleResults[detail.userRole] = { passed: 0, failed: 0 };
    }
    if (detail.passed) {
      roleResults[detail.userRole].passed++;
    } else {
      roleResults[detail.userRole].failed++;
    }
  });
  
  Object.entries(roleResults).forEach(([role, results]) => {
    const total = results.passed + results.failed;
    const successRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 'N/A';
    console.log(`   ${role.toUpperCase()}: ${results.passed}/${total} (${successRate}%)`);
  });
  
  console.log(`\n📄 Full test details logged above.`);
  console.log('='.repeat(80));
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Test interrupted by user');
  generateTestReport();
});

process.on('uncaughtException', (error) => {
  console.error('\n💥 Uncaught exception:', error.message);
  generateTestReport();
});

// Wait for server to be ready, then run tests
function waitForServer() {
  return new Promise((resolve) => {
    const checkServer = async () => {
      try {
        const health = await makeRequest('GET', '/api/health');
        if (health.status === 200) {
          resolve();
        } else {
          setTimeout(checkServer, 1000);
        }
      } catch (error) {
        setTimeout(checkServer, 1000);
      }
    };
    checkServer();
  });
}

// Main execution
async function main() {
  console.log('⏳ Waiting for server to be ready...');
  await waitForServer();
  console.log('✅ Server is ready!\n');
  
  await runRBACTests();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  });
}

export { runRBACTests, TEST_USERS, ACCESS_MATRIX };