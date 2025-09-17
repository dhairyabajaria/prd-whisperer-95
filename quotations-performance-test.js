#!/usr/bin/env node

// Quotations Performance Testing Script
// Target: Reduce response time from 1065ms baseline to <200ms (81% improvement)

import { performance } from 'perf_hooks';

async function testQuotationsPerformance() {
  const baseUrl = process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
    : 'http://localhost:5000';
    
  console.log('🚀 Starting Quotations Performance Analysis');
  console.log('📊 Target: <200ms (from 1065ms baseline = 81% improvement required)');
  console.log('🔗 Testing against:', baseUrl);
  console.log('');

  const testScenarios = [
    { name: 'No filters (default)', params: '' },
    { name: 'Limited results', params: '?limit=10' },
    { name: 'Status filter', params: '?status=draft' },
    { name: 'Status + limit', params: '?status=sent&limit=20' },
  ];

  const results = [];
  let totalTests = 0;
  let successfulTests = 0;

  for (const scenario of testScenarios) {
    console.log(`📋 Testing: ${scenario.name}`);
    
    // Run each scenario multiple times for accuracy
    const iterations = 5;
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      try {
        const startTime = performance.now();
        
        const response = await fetch(`${baseUrl}/api/crm/quotations${scenario.params}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Add any authentication headers if needed
          }
        });
        
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        
        totalTests++;
        
        if (response.ok) {
          const data = await response.json();
          times.push(duration);
          successfulTests++;
          console.log(`  ✅ Iteration ${i + 1}: ${duration}ms (${data.length || 0} records)`);
        } else {
          console.log(`  ❌ Iteration ${i + 1}: ${response.status} ${response.statusText}`);
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        totalTests++;
        console.log(`  ❌ Iteration ${i + 1}: Error - ${error.message}`);
      }
    }
    
    if (times.length > 0) {
      const avgTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      
      results.push({
        scenario: scenario.name,
        avgTime,
        minTime,
        maxTime,
        times,
        targetMet: avgTime < 200
      });
      
      const status = avgTime < 200 ? '✅' : '⚠️';
      console.log(`  ${status} Average: ${avgTime}ms | Min: ${minTime}ms | Max: ${maxTime}ms`);
      
      if (avgTime >= 200) {
        const improvement = Math.round(((avgTime - 200) / avgTime) * 100);
        console.log(`  🎯 Need ${improvement}% improvement to reach <200ms target`);
      }
    }
    
    console.log('');
  }

  // Summary Report
  console.log('📈 PERFORMANCE SUMMARY');
  console.log('========================');
  console.log(`Total tests run: ${totalTests}`);
  console.log(`Successful tests: ${successfulTests}`);
  console.log(`Success rate: ${Math.round((successfulTests/totalTests) * 100)}%`);
  console.log('');
  
  if (results.length > 0) {
    console.log('📊 DETAILED RESULTS:');
    results.forEach(result => {
      const status = result.targetMet ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${result.scenario}:`);
      console.log(`   Average: ${result.avgTime}ms`);
      console.log(`   Range: ${result.minTime}ms - ${result.maxTime}ms`);
      console.log(`   Times: [${result.times.join(', ')}]ms`);
      
      if (!result.targetMet) {
        const improvementNeeded = Math.round(((result.avgTime - 200) / result.avgTime) * 100);
        console.log(`   ⚡ Improvement needed: ${improvementNeeded}%`);
      }
      console.log('');
    });

    // Overall assessment
    const passedTests = results.filter(r => r.targetMet).length;
    const failedTests = results.length - passedTests;
    
    console.log('🎯 TARGET ASSESSMENT:');
    console.log(`Scenarios meeting <200ms target: ${passedTests}/${results.length}`);
    console.log(`Scenarios needing optimization: ${failedTests}/${results.length}`);
    
    if (failedTests === 0) {
      console.log('🎉 ALL SCENARIOS MEET PERFORMANCE TARGET!');
    } else {
      console.log('⚡ OPTIMIZATION REQUIRED');
      
      // Identify worst performer
      const worstResult = results.reduce((worst, current) => 
        current.avgTime > worst.avgTime ? current : worst
      );
      console.log(`📉 Slowest scenario: "${worstResult.scenario}" at ${worstResult.avgTime}ms`);
      
      // Calculate overall improvement needed
      const avgOfAllResults = Math.round(
        results.reduce((sum, r) => sum + r.avgTime, 0) / results.length
      );
      console.log(`📊 Overall average response time: ${avgOfAllResults}ms`);
      
      if (avgOfAllResults > 200) {
        const overallImprovement = Math.round(((avgOfAllResults - 200) / avgOfAllResults) * 100);
        console.log(`🚀 Overall improvement needed: ${overallImprovement}%`);
      }
    }
  }
  
  console.log('');
  console.log('🔍 NEXT STEPS FOR OPTIMIZATION:');
  console.log('1. Database query analysis and indexing optimization');
  console.log('2. Query result caching enhancement');
  console.log('3. SQL query refactoring for efficiency');
  console.log('4. Batch processing optimization');
  console.log('5. Connection pooling fine-tuning');
  
  return results;
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testQuotationsPerformance()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

export { testQuotationsPerformance };