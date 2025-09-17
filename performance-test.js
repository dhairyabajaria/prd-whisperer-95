#!/usr/bin/env node

/**
 * Comprehensive Performance Testing Suite for Pharmaceutical ERP/CRM
 * Tests API response times, concurrent requests, and identifies bottlenecks
 */

import http from 'http';
import https from 'https';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

class PerformanceTester {
  constructor(baseUrl = 'http://localhost:5000') {
    this.baseUrl = baseUrl;
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {},
      endpoints: {},
      concurrency: {},
      errors: []
    };
  }

  // Make HTTP request and measure response time
  async makeRequest(endpoint, method = 'GET', data = null) {
    const startTime = process.hrtime.bigint();
    
    return new Promise((resolve, reject) => {
      const url = `${this.baseUrl}${endpoint}`;
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'PerformanceTester/1.0'
        },
        timeout: 30000
      };

      const client = urlObj.protocol === 'https:' ? https : http;
      const req = client.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          const endTime = process.hrtime.bigint();
          const responseTime = Number(endTime - startTime) / 1000000; // Convert to ms
          
          resolve({
            statusCode: res.statusCode,
            responseTime,
            contentLength: responseData.length,
            headers: res.headers,
            data: responseData
          });
        });
      });

      req.on('error', (error) => {
        const endTime = process.hrtime.bigint();
        const responseTime = Number(endTime - startTime) / 1000000;
        reject({ error, responseTime });
      });

      req.on('timeout', () => {
        req.destroy();
        const endTime = process.hrtime.bigint();
        const responseTime = Number(endTime - startTime) / 1000000;
        reject({ error: 'Request timeout', responseTime });
      });

      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  // Test single endpoint multiple times for statistics
  async testEndpoint(endpoint, iterations = 5, name = null) {
    const testName = name || endpoint;
    console.log(`🧪 Testing ${testName} (${iterations} iterations)...`);
    
    const results = [];
    const errors = [];
    
    for (let i = 0; i < iterations; i++) {
      try {
        const result = await this.makeRequest(endpoint);
        results.push(result);
        process.stdout.write('.');
      } catch (error) {
        errors.push(error);
        process.stdout.write('x');
      }
    }
    
    console.log(''); // New line after dots
    
    if (results.length === 0) {
      console.log(`❌ ${testName}: All requests failed`);
      return null;
    }

    const responseTimes = results.map(r => r.responseTime);
    const stats = {
      endpoint,
      name: testName,
      iterations,
      successCount: results.length,
      errorCount: errors.length,
      successRate: (results.length / iterations) * 100,
      responseTime: {
        min: Math.min(...responseTimes),
        max: Math.max(...responseTimes),
        avg: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
        median: this.calculateMedian(responseTimes),
        p95: this.calculatePercentile(responseTimes, 95),
        p99: this.calculatePercentile(responseTimes, 99)
      },
      statusCodes: results.reduce((acc, r) => {
        acc[r.statusCode] = (acc[r.statusCode] || 0) + 1;
        return acc;
      }, {}),
      avgContentLength: results.reduce((a, r) => a + r.contentLength, 0) / results.length
    };

    // Store errors
    if (errors.length > 0) {
      this.results.errors.push({
        endpoint: testName,
        errors: errors.map(e => e.error.message || e.error)
      });
    }

    this.results.endpoints[testName] = stats;
    console.log(`✅ ${testName}: ${stats.responseTime.avg.toFixed(2)}ms avg (${stats.successRate.toFixed(1)}% success)`);
    
    return stats;
  }

  // Test concurrent requests
  async testConcurrency(endpoint, concurrentUsers = 10, requestsPerUser = 3) {
    console.log(`🚀 Testing concurrency: ${endpoint} (${concurrentUsers} users, ${requestsPerUser} requests each)`);
    
    const startTime = Date.now();
    const promises = [];
    
    for (let user = 0; user < concurrentUsers; user++) {
      for (let req = 0; req < requestsPerUser; req++) {
        promises.push(this.makeRequest(endpoint).catch(err => ({ error: err })));
      }
    }
    
    const results = await Promise.all(promises);
    const endTime = Date.now();
    
    const successful = results.filter(r => !r.error);
    const failed = results.filter(r => r.error);
    
    const stats = {
      endpoint,
      concurrentUsers,
      requestsPerUser,
      totalRequests: promises.length,
      successfulRequests: successful.length,
      failedRequests: failed.length,
      totalTime: endTime - startTime,
      throughput: (successful.length / (endTime - startTime)) * 1000, // requests per second
      avgResponseTime: successful.length > 0 ? 
        successful.reduce((sum, r) => sum + r.responseTime, 0) / successful.length : 0
    };
    
    this.results.concurrency[endpoint] = stats;
    console.log(`✅ Concurrency test: ${stats.throughput.toFixed(2)} req/s, ${stats.avgResponseTime.toFixed(2)}ms avg`);
    
    return stats;
  }

  // Run comprehensive performance test suite
  async runComprehensiveTest() {
    console.log('🎯 Starting Comprehensive Performance Testing Suite');
    console.log('================================================\n');

    // Critical endpoints to test
    const criticalEndpoints = [
      { endpoint: '/api/health', name: 'Health Check' },
      { endpoint: '/api/auth/user', name: 'User Authentication' },
      { endpoint: '/api/dashboard/metrics', name: 'Dashboard Metrics' },
      { endpoint: '/api/dashboard/transactions', name: 'Dashboard Transactions' },
      { endpoint: '/api/dashboard/expiring-products', name: 'Expiring Products' },
      { endpoint: '/api/customers', name: 'Customer List' },
      { endpoint: '/api/products', name: 'Product List' },
      { endpoint: '/api/inventory', name: 'Inventory Data' },
      { endpoint: '/api/suppliers', name: 'Supplier List' },
      { endpoint: '/api/warehouses', name: 'Warehouse List' },
      { endpoint: '/api/sales-orders', name: 'Sales Orders' },
      { endpoint: '/api/purchase-orders', name: 'Purchase Orders' },
      { endpoint: '/api/quotations', name: 'Quotations' },
      { endpoint: '/api/employees', name: 'Employee List' },
      { endpoint: '/api/pos-terminals', name: 'POS Terminals' }
    ];

    // 1. Single request performance testing
    console.log('📊 Phase 1: Single Request Performance Testing\n');
    for (const { endpoint, name } of criticalEndpoints) {
      await this.testEndpoint(endpoint, 10, name);
      await this.sleep(100); // Small delay between tests
    }

    // 2. Concurrency testing for critical endpoints
    console.log('\n🚀 Phase 2: Concurrency Testing\n');
    const concurrencyTestEndpoints = [
      '/api/health',
      '/api/dashboard/metrics',
      '/api/customers',
      '/api/products',
      '/api/inventory'
    ];

    for (const endpoint of concurrencyTestEndpoints) {
      await this.testConcurrency(endpoint, 5, 2);
      await this.sleep(500); // Longer delay between concurrency tests
    }

    // 3. High-load concurrency test
    console.log('\n🔥 Phase 3: High-Load Testing\n');
    await this.testConcurrency('/api/health', 20, 5);
    await this.testConcurrency('/api/dashboard/metrics', 10, 3);

    // Generate summary
    this.generateSummary();
    
    console.log('\n🎉 Performance Testing Complete!');
    return this.results;
  }

  generateSummary() {
    const endpoints = Object.values(this.results.endpoints);
    if (endpoints.length === 0) return;

    const avgResponseTimes = endpoints.map(e => e.responseTime.avg);
    const totalRequests = endpoints.reduce((sum, e) => sum + e.successCount, 0);
    const totalErrors = endpoints.reduce((sum, e) => sum + e.errorCount, 0);

    this.results.summary = {
      totalEndpoints: endpoints.length,
      totalRequests,
      totalErrors,
      overallSuccessRate: ((totalRequests / (totalRequests + totalErrors)) * 100).toFixed(2),
      avgResponseTime: (avgResponseTimes.reduce((a, b) => a + b, 0) / avgResponseTimes.length).toFixed(2),
      fastestEndpoint: endpoints.reduce((min, e) => 
        e.responseTime.avg < min.responseTime.avg ? e : min),
      slowestEndpoint: endpoints.reduce((max, e) => 
        e.responseTime.avg > max.responseTime.avg ? e : max),
      highLatencyEndpoints: endpoints.filter(e => e.responseTime.avg > 1000),
      errorProneEndpoints: endpoints.filter(e => e.successRate < 90)
    };
  }

  // Utility functions
  calculateMedian(arr) {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  calculatePercentile(arr, percentile) {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || sorted[sorted.length - 1];
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Save results to file
  saveResults(filename = `performance-results-${Date.now()}.json`) {
    fs.writeFileSync(filename, JSON.stringify(this.results, null, 2));
    console.log(`📄 Results saved to ${filename}`);
    return filename;
  }

  // Generate human-readable report
  generateReport() {
    const report = [`
🎯 PHARMACEUTICAL ERP/CRM PERFORMANCE TEST REPORT
==================================================
Test Date: ${this.results.timestamp}
Test Duration: Comprehensive API Performance Analysis

📊 SUMMARY STATISTICS
---------------------
Total Endpoints Tested: ${this.results.summary.totalEndpoints}
Total Requests: ${this.results.summary.totalRequests}
Total Errors: ${this.results.summary.totalErrors}
Overall Success Rate: ${this.results.summary.overallSuccessRate}%
Average Response Time: ${this.results.summary.avgResponseTime}ms

🏆 PERFORMANCE LEADERS
----------------------
Fastest Endpoint: ${this.results.summary.fastestEndpoint.name} (${this.results.summary.fastestEndpoint.responseTime.avg.toFixed(2)}ms)
Slowest Endpoint: ${this.results.summary.slowestEndpoint.name} (${this.results.summary.slowestEndpoint.responseTime.avg.toFixed(2)}ms)

⚠️  PERFORMANCE CONCERNS
-----------------------`];

    if (this.results.summary.highLatencyEndpoints.length > 0) {
      report.push(`High Latency Endpoints (>1000ms):`);
      this.results.summary.highLatencyEndpoints.forEach(e => {
        report.push(`  • ${e.name}: ${e.responseTime.avg.toFixed(2)}ms`);
      });
    }

    if (this.results.summary.errorProneEndpoints.length > 0) {
      report.push(`Error-Prone Endpoints (<90% success):`);
      this.results.summary.errorProneEndpoints.forEach(e => {
        report.push(`  • ${e.name}: ${e.successRate.toFixed(1)}% success rate`);
      });
    }

    report.push(`
📈 DETAILED ENDPOINT ANALYSIS
-----------------------------`);

    Object.values(this.results.endpoints).forEach(endpoint => {
      report.push(`
${endpoint.name}:
  • Avg Response: ${endpoint.responseTime.avg.toFixed(2)}ms
  • Min/Max: ${endpoint.responseTime.min.toFixed(2)}ms / ${endpoint.responseTime.max.toFixed(2)}ms
  • P95/P99: ${endpoint.responseTime.p95.toFixed(2)}ms / ${endpoint.responseTime.p99.toFixed(2)}ms
  • Success Rate: ${endpoint.successRate.toFixed(1)}%
  • Avg Content: ${Math.round(endpoint.avgContentLength)} bytes`);
    });

    if (Object.keys(this.results.concurrency).length > 0) {
      report.push(`
🚀 CONCURRENCY TEST RESULTS
---------------------------`);
      
      Object.values(this.results.concurrency).forEach(test => {
        report.push(`
${test.endpoint}:
  • Throughput: ${test.throughput.toFixed(2)} requests/second
  • Success Rate: ${((test.successfulRequests/test.totalRequests)*100).toFixed(1)}%
  • Avg Response: ${test.avgResponseTime.toFixed(2)}ms
  • Total Time: ${test.totalTime}ms`);
      });
    }

    return report.join('\n');
  }
}

// Main execution
async function main() {
  const tester = new PerformanceTester();
  
  try {
    const results = await tester.runComprehensiveTest();
    
    // Save detailed results
    const resultsFile = tester.saveResults();
    
    // Generate and save human-readable report
    const report = tester.generateReport();
    const reportFile = `performance-report-${Date.now()}.txt`;
    fs.writeFileSync(reportFile, report);
    
    console.log(`\n📄 Human-readable report saved to ${reportFile}`);
    console.log('\n' + '='.repeat(60));
    console.log(report);
    
  } catch (error) {
    console.error('❌ Performance testing failed:', error);
    process.exit(1);
  }
}

// Export for use as module
export default PerformanceTester;

// Run if called directly
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (process.argv[1] === __filename) {
  main();
}