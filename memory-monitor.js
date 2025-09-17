#!/usr/bin/env node

/**
 * Memory and Resource Monitor for Pharmaceutical ERP/CRM
 * Monitors server memory usage and identifies potential leaks
 */

import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class MemoryMonitor {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      memorySnapshots: [],
      processInfo: {},
      systemMetrics: {},
      loadTests: [],
      recommendations: []
    };
    this.startTime = Date.now();
  }

  // Get current memory usage
  async getMemorySnapshot() {
    const usage = process.memoryUsage();
    const snapshot = {
      timestamp: new Date().toISOString(),
      rss: usage.rss, // Resident Set Size - total memory allocated
      heapTotal: usage.heapTotal, // Total heap allocated
      heapUsed: usage.heapUsed, // Actual heap used
      external: usage.external, // External memory usage
      arrayBuffers: usage.arrayBuffers || 0,
      // Calculate percentages
      heapUtilization: (usage.heapUsed / usage.heapTotal) * 100,
      // Human readable sizes
      rssHuman: this.formatBytes(usage.rss),
      heapTotalHuman: this.formatBytes(usage.heapTotal),
      heapUsedHuman: this.formatBytes(usage.heapUsed),
      externalHuman: this.formatBytes(usage.external)
    };
    
    this.results.memorySnapshots.push(snapshot);
    return snapshot;
  }

  // Get system information
  async getSystemInfo() {
    try {
      // Get Node.js process info
      this.results.processInfo = {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
        uptime: process.uptime(),
        cwd: process.cwd()
      };

      // Try to get system memory info (Linux/Unix)
      try {
        const { stdout: meminfo } = await execAsync('cat /proc/meminfo | head -10');
        const memLines = meminfo.split('\n').filter(line => line.trim());
        const memData = {};
        
        memLines.forEach(line => {
          const [key, value] = line.split(':');
          if (key && value) {
            memData[key.trim()] = value.trim();
          }
        });
        
        this.results.systemMetrics.memory = memData;
      } catch (error) {
        this.results.systemMetrics.memory = { error: 'Could not read /proc/meminfo' };
      }

      // Try to get CPU info
      try {
        const { stdout: cpuinfo } = await execAsync('cat /proc/cpuinfo | grep "model name" | head -1');
        this.results.systemMetrics.cpu = cpuinfo.trim();
      } catch (error) {
        this.results.systemMetrics.cpu = { error: 'Could not read CPU info' };
      }

      // Get load averages (Unix-like systems)
      try {
        const loadavg = await fs.promises.readFile('/proc/loadavg', 'utf8');
        const loads = loadavg.trim().split(' ').slice(0, 3);
        this.results.systemMetrics.loadAverage = {
          '1min': parseFloat(loads[0]),
          '5min': parseFloat(loads[1]),
          '15min': parseFloat(loads[2])
        };
      } catch (error) {
        this.results.systemMetrics.loadAverage = { error: 'Could not read load average' };
      }

    } catch (error) {
      console.error('Error getting system info:', error.message);
    }
  }

  // Monitor memory during load test
  async monitorDuringLoad(testName, loadFunction, duration = 30000) {
    console.log(`🧪 Starting memory monitoring for: ${testName}`);
    
    const startSnapshot = await this.getMemorySnapshot();
    const snapshots = [startSnapshot];
    
    // Start monitoring interval
    const monitoringInterval = setInterval(async () => {
      const snapshot = await this.getMemorySnapshot();
      snapshots.push(snapshot);
    }, 1000); // Every second

    // Run the load test
    const loadStartTime = Date.now();
    let loadResults;
    
    try {
      loadResults = await Promise.race([
        loadFunction(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Load test timeout')), duration)
        )
      ]);
    } catch (error) {
      loadResults = { error: error.message };
    }
    
    const loadEndTime = Date.now();
    clearInterval(monitoringInterval);
    
    // Final snapshot
    const endSnapshot = await this.getMemorySnapshot();
    snapshots.push(endSnapshot);
    
    // Analyze memory behavior
    const memoryAnalysis = this.analyzeMemoryBehavior(snapshots, testName);
    
    const testResult = {
      testName,
      duration: loadEndTime - loadStartTime,
      startMemory: startSnapshot,
      endMemory: endSnapshot,
      peakMemory: this.findPeakMemory(snapshots),
      memoryLeak: this.detectMemoryLeak(snapshots),
      analysis: memoryAnalysis,
      loadResults
    };
    
    this.results.loadTests.push(testResult);
    
    console.log(`✅ ${testName} completed:`);
    console.log(`   Duration: ${testResult.duration}ms`);
    console.log(`   Memory change: ${this.formatBytes(endSnapshot.rss - startSnapshot.rss)}`);
    console.log(`   Peak memory: ${endSnapshot.rssHuman}`);
    if (testResult.memoryLeak.detected) {
      console.log(`   ⚠️  Potential memory leak detected!`);
    }
    
    return testResult;
  }

  // Analyze memory behavior patterns
  analyzeMemoryBehavior(snapshots, testName) {
    if (snapshots.length < 2) return {};
    
    const rssTrend = this.calculateTrend(snapshots.map(s => s.rss));
    const heapTrend = this.calculateTrend(snapshots.map(s => s.heapUsed));
    
    return {
      rssTrend: rssTrend > 0 ? 'increasing' : rssTrend < 0 ? 'decreasing' : 'stable',
      heapTrend: heapTrend > 0 ? 'increasing' : heapTrend < 0 ? 'decreasing' : 'stable',
      avgHeapUtilization: snapshots.reduce((sum, s) => sum + s.heapUtilization, 0) / snapshots.length,
      memoryVolatility: this.calculateVolatility(snapshots.map(s => s.rss))
    };
  }

  // Find peak memory usage
  findPeakMemory(snapshots) {
    return snapshots.reduce((peak, current) => 
      current.rss > peak.rss ? current : peak
    );
  }

  // Detect potential memory leaks
  detectMemoryLeak(snapshots) {
    if (snapshots.length < 10) {
      return { detected: false, reason: 'Insufficient data points' };
    }
    
    const rssTrend = this.calculateTrend(snapshots.map(s => s.rss));
    const heapTrend = this.calculateTrend(snapshots.map(s => s.heapUsed));
    
    // Simple heuristic: consistent upward trend in memory
    const leakThreshold = 1024 * 1024; // 1MB increase trend
    
    if (rssTrend > leakThreshold || heapTrend > leakThreshold) {
      return {
        detected: true,
        severity: rssTrend > leakThreshold * 5 ? 'high' : 'medium',
        rssTrend: this.formatBytes(rssTrend),
        heapTrend: this.formatBytes(heapTrend)
      };
    }
    
    return { detected: false };
  }

  // Calculate linear trend (slope)
  calculateTrend(values) {
    const n = values.length;
    if (n < 2) return 0;
    
    const xSum = (n * (n - 1)) / 2; // 0 + 1 + 2 + ... + (n-1)
    const ySum = values.reduce((sum, val) => sum + val, 0);
    const xySum = values.reduce((sum, val, index) => sum + (val * index), 0);
    const xxSum = (n * (n - 1) * (2 * n - 1)) / 6; // 0² + 1² + 2² + ... + (n-1)²
    
    return (n * xySum - xSum * ySum) / (n * xxSum - xSum * xSum);
  }

  // Calculate memory volatility (standard deviation)
  calculateVolatility(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  // Simulate API load for memory testing
  async simulateAPILoad() {
    const responses = [];
    const concurrent = 10;
    const requestsPerConcurrent = 5;
    
    const promises = [];
    
    for (let i = 0; i < concurrent; i++) {
      for (let j = 0; j < requestsPerConcurrent; j++) {
        promises.push(
          fetch('http://localhost:5000/api/dashboard/metrics')
            .then(res => res.json())
            .catch(err => ({ error: err.message }))
        );
      }
    }
    
    const results = await Promise.all(promises);
    const successful = results.filter(r => !r.error);
    
    return {
      totalRequests: promises.length,
      successful: successful.length,
      failed: results.length - successful.length,
      successRate: (successful.length / results.length) * 100
    };
  }

  // Run comprehensive memory analysis
  async runComprehensiveMonitoring() {
    console.log('🧠 Starting Comprehensive Memory & Resource Monitoring');
    console.log('====================================================\n');

    // Get initial system info
    await this.getSystemInfo();
    
    // Initial memory snapshot
    const initialSnapshot = await this.getMemorySnapshot();
    console.log(`📊 Initial Memory State:`);
    console.log(`   RSS: ${initialSnapshot.rssHuman}`);
    console.log(`   Heap Used: ${initialSnapshot.heapUsedHuman} / ${initialSnapshot.heapTotalHuman}`);
    console.log(`   Heap Utilization: ${initialSnapshot.heapUtilization.toFixed(1)}%\n`);

    // Test 1: Memory during idle period
    await this.monitorDuringLoad(
      'Idle Memory Baseline',
      () => new Promise(resolve => setTimeout(resolve, 5000)),
      6000
    );

    // Test 2: Memory during API load
    await this.monitorDuringLoad(
      'API Load Memory Test',
      () => this.simulateAPILoad(),
      15000
    );

    // Test 3: Memory after garbage collection
    if (global.gc) {
      console.log('🗑️  Running garbage collection...');
      global.gc();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.getMemorySnapshot();
    } else {
      console.log('⚠️  Garbage collection not available (run with --expose-gc)');
    }

    // Generate recommendations
    this.generateMemoryRecommendations();
    
    console.log('\n🎉 Memory Monitoring Complete!');
    return this.results;
  }

  // Generate memory optimization recommendations
  generateMemoryRecommendations() {
    console.log('\n💡 Generating Memory Optimization Recommendations...');
    
    const recommendations = [];
    const latestSnapshot = this.results.memorySnapshots[this.results.memorySnapshots.length - 1];
    
    // High memory usage warning
    if (latestSnapshot.rss > 512 * 1024 * 1024) { // > 512MB
      recommendations.push({
        type: 'high_memory_usage',
        priority: 'medium',
        issue: `High memory usage detected: ${latestSnapshot.rssHuman}`,
        recommendation: 'Monitor memory usage in production and consider implementing memory limits'
      });
    }

    // Heap utilization analysis
    if (latestSnapshot.heapUtilization > 80) {
      recommendations.push({
        type: 'heap_pressure',
        priority: 'medium',
        issue: `High heap utilization: ${latestSnapshot.heapUtilization.toFixed(1)}%`,
        recommendation: 'Consider increasing heap size or optimizing memory usage'
      });
    }

    // Memory leak detection
    const leakyTests = this.results.loadTests.filter(test => test.memoryLeak.detected);
    if (leakyTests.length > 0) {
      recommendations.push({
        type: 'memory_leak',
        priority: 'high',
        issue: `Potential memory leaks detected in ${leakyTests.length} tests`,
        recommendation: 'Investigate and fix memory leaks to prevent production issues',
        affectedTests: leakyTests.map(test => test.testName)
      });
    }

    // System load analysis
    if (this.results.systemMetrics.loadAverage && this.results.systemMetrics.loadAverage['1min'] > 2) {
      recommendations.push({
        type: 'high_system_load',
        priority: 'medium',
        issue: `High system load: ${this.results.systemMetrics.loadAverage['1min']}`,
        recommendation: 'Monitor system performance and consider resource scaling'
      });
    }

    this.results.recommendations = recommendations;
    
    // Print recommendations
    console.log('\n📋 MEMORY OPTIMIZATION RECOMMENDATIONS:');
    recommendations.forEach((rec, index) => {
      console.log(`\n${index + 1}. [${rec.priority.toUpperCase()}] ${rec.issue}`);
      console.log(`   💡 ${rec.recommendation}`);
      if (rec.affectedTests) console.log(`   📊 Affected: ${rec.affectedTests.join(', ')}`);
    });
  }

  // Utility function to format bytes
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Save results to file
  saveResults(filename = `memory-monitor-results-${Date.now()}.json`) {
    fs.writeFileSync(filename, JSON.stringify(this.results, null, 2));
    console.log(`📄 Memory monitoring results saved to ${filename}`);
    return filename;
  }

  // Generate human-readable report
  generateReport() {
    const report = [`
🧠 MEMORY & RESOURCE MONITORING REPORT
=====================================
Monitoring Date: ${this.results.timestamp}
Process Info: Node.js ${this.results.processInfo.nodeVersion} on ${this.results.processInfo.platform}

📊 MEMORY USAGE SUMMARY
----------------------`];

    const snapshots = this.results.memorySnapshots;
    if (snapshots.length > 0) {
      const initial = snapshots[0];
      const final = snapshots[snapshots.length - 1];
      const peak = this.findPeakMemory(snapshots);
      
      report.push(`Initial Memory: ${initial.rssHuman}`);
      report.push(`Final Memory: ${final.rssHuman}`);
      report.push(`Peak Memory: ${peak.rssHuman}`);
      report.push(`Memory Change: ${this.formatBytes(final.rss - initial.rss)}`);
      report.push(`Avg Heap Utilization: ${(snapshots.reduce((sum, s) => sum + s.heapUtilization, 0) / snapshots.length).toFixed(1)}%`);
    }

    // Load test results
    if (this.results.loadTests.length > 0) {
      report.push(`\n🧪 LOAD TEST MEMORY ANALYSIS\n${'='.repeat(29)}`);
      this.results.loadTests.forEach(test => {
        report.push(`\n${test.testName}:`);
        report.push(`  Duration: ${test.duration}ms`);
        report.push(`  Memory Change: ${this.formatBytes(test.endMemory.rss - test.startMemory.rss)}`);
        report.push(`  Peak Memory: ${test.peakMemory.rssHuman}`);
        if (test.memoryLeak.detected) {
          report.push(`  ⚠️  Memory Leak: ${test.memoryLeak.severity} severity`);
        }
      });
    }

    // System metrics
    if (this.results.systemMetrics.loadAverage) {
      report.push(`\n🖥️  SYSTEM METRICS\n${'='.repeat(16)}`);
      report.push(`Load Average: ${this.results.systemMetrics.loadAverage['1min']} (1min)`);
    }

    // Recommendations
    if (this.results.recommendations.length > 0) {
      report.push(`\n💡 OPTIMIZATION RECOMMENDATIONS\n${'='.repeat(32)}`);
      this.results.recommendations.forEach((rec, index) => {
        report.push(`\n${index + 1}. [${rec.priority.toUpperCase()}] ${rec.issue}`);
        report.push(`   Solution: ${rec.recommendation}`);
      });
    }

    return report.join('\n');
  }
}

// Main execution
async function main() {
  const monitor = new MemoryMonitor();
  
  try {
    const results = await monitor.runComprehensiveMonitoring();
    
    // Save detailed results
    const resultsFile = monitor.saveResults();
    
    // Generate and save human-readable report
    const report = monitor.generateReport();
    const reportFile = `memory-monitor-report-${Date.now()}.txt`;
    fs.writeFileSync(reportFile, report);
    
    console.log(`\n📄 Memory monitoring report saved to ${reportFile}`);
    console.log('\n' + '='.repeat(60));
    console.log(report);
    
  } catch (error) {
    console.error('❌ Memory monitoring failed:', error);
    process.exit(1);
  }
}

// Export for use as module
export default MemoryMonitor;

// Run if called directly
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] === __filename) {
  main();
}