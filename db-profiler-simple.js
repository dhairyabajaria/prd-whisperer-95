#!/usr/bin/env node

/**
 * Simple Database Query Profiler for Pharmaceutical ERP/CRM
 * Uses direct PostgreSQL connection to profile database queries
 */

import { Pool } from '@neondatabase/serverless';
import fs from 'fs';

class SimpleDatabaseProfiler {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      queryAnalysis: {},
      tableStats: {},
      indexAnalysis: {},
      slowQueries: [],
      recommendations: []
    };
    this.pool = null;
  }

  async initialize() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable not found');
    }
    
    this.pool = new Pool({ connectionString: databaseUrl });
    console.log('🔗 Database connection established for profiling');
  }

  // Execute SQL and measure performance
  async profileQuery(name, sql, params = []) {
    const startTime = process.hrtime.bigint();
    
    try {
      const result = await this.pool.query(sql, params);
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // Convert to ms
      
      const analysis = {
        name,
        sql: sql.replace(/\s+/g, ' ').trim(),
        duration,
        rowCount: result.rows ? result.rows.length : 0,
        success: true
      };

      console.log(`✅ ${name}: ${duration.toFixed(2)}ms (${analysis.rowCount} rows)`);
      this.results.queryAnalysis[name] = analysis;
      
      if (duration > 1000) {
        this.results.slowQueries.push(analysis);
      }
      
      return result.rows;
    } catch (error) {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000;
      
      console.log(`❌ ${name}: Failed in ${duration.toFixed(2)}ms - ${error.message}`);
      this.results.queryAnalysis[name] = {
        name,
        sql: sql.replace(/\s+/g, ' ').trim(),
        duration,
        error: error.message,
        success: false
      };
      
      return null;
    }
  }

  // Test the exact queries that are causing dashboard slowness
  async profileDashboardQueries() {
    console.log('\n📈 Profiling Dashboard Queries (Exact Implementation)...');
    
    // Query 1: Total revenue from confirmed sales orders
    await this.profileQuery(
      'Dashboard Revenue Query',
      `SELECT COALESCE(SUM(total_amount), 0) as total_revenue 
       FROM sales_orders 
       WHERE status = 'confirmed'`
    );
    
    // Query 2: Active products count
    await this.profileQuery(
      'Dashboard Active Products',
      `SELECT COUNT(*) as active_products 
       FROM products 
       WHERE is_active = true`
    );
    
    // Query 3: Open orders count
    await this.profileQuery(
      'Dashboard Open Orders',
      `SELECT COUNT(*) as open_orders 
       FROM sales_orders 
       WHERE status IN ('draft', 'confirmed')`
    );
    
    // Query 4: Outstanding amount from unpaid invoices
    await this.profileQuery(
      'Dashboard Outstanding Amount',
      `SELECT COALESCE(SUM(total_amount - paid_amount), 0) as outstanding_amount 
       FROM invoices 
       WHERE status IN ('sent', 'overdue')`
    );
    
    // Query 5: Expiring products count (90 days) - the complex one
    await this.profileQuery(
      'Dashboard Expiring Products',
      `SELECT COUNT(*) as expiring_count 
       FROM inventory 
       WHERE expiry_date <= CURRENT_DATE + INTERVAL '90 days'
       AND expiry_date > CURRENT_DATE
       AND quantity >= 1`
    );
    
    // Test the combined query (simulating what the actual endpoint does with Promise.all)
    await this.profileQuery(
      'Dashboard Combined Query',
      `SELECT 
         (SELECT COALESCE(SUM(total_amount), 0) FROM sales_orders WHERE status = 'confirmed') as total_revenue,
         (SELECT COUNT(*) FROM products WHERE is_active = true) as active_products,
         (SELECT COUNT(*) FROM sales_orders WHERE status IN ('draft', 'confirmed')) as open_orders,
         (SELECT COALESCE(SUM(total_amount - paid_amount), 0) FROM invoices WHERE status IN ('sent', 'overdue')) as outstanding_amount,
         (SELECT COUNT(*) FROM inventory WHERE expiry_date <= CURRENT_DATE + INTERVAL '90 days' AND expiry_date > CURRENT_DATE AND quantity >= 1) as expiring_count`
    );
  }

  // Analyze table statistics for performance insights
  async analyzeTableStats() {
    console.log('\n📊 Analyzing table statistics...');
    
    const tableStatsQuery = `
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_tuples,
        n_dead_tup as dead_tuples,
        last_vacuum,
        last_autovacuum,
        last_analyze,
        last_autoanalyze
      FROM pg_stat_user_tables 
      ORDER BY n_live_tup DESC;
    `;
    
    const stats = await this.profileQuery('Table Statistics', tableStatsQuery);
    
    if (stats) {
      this.results.tableStats = stats.map(row => ({
        table: row.tablename,
        liveRows: parseInt(row.n_live_tup) || 0,
        deadRows: parseInt(row.n_dead_tup) || 0,
        inserts: parseInt(row.n_tup_ins) || 0,
        updates: parseInt(row.n_tup_upd) || 0,
        deletes: parseInt(row.n_tup_del) || 0,
        lastVacuum: row.last_vacuum,
        lastAnalyze: row.last_analyze
      }));
    }
  }

  // Check for missing indexes on critical columns
  async analyzeIndexUsage() {
    console.log('\n🔍 Analyzing index usage and coverage...');
    
    // Check existing indexes
    const indexQuery = `
      SELECT 
        t.tablename,
        i.indexname,
        pg_size_pretty(pg_relation_size(c.oid)) AS index_size,
        s.idx_scan,
        s.idx_tup_read,
        s.idx_tup_fetch,
        pg_get_indexdef(c.oid) as index_definition
      FROM pg_stat_user_indexes s
      JOIN pg_stat_user_tables t ON s.relid = t.relid
      JOIN pg_class c ON c.oid = s.indexrelid
      JOIN pg_index i ON i.indexrelid = s.indexrelid
      ORDER BY s.idx_scan DESC;
    `;
    
    const indexes = await this.profileQuery('Index Usage Analysis', indexQuery);
    
    if (indexes) {
      this.results.indexAnalysis = indexes.map(row => ({
        table: row.tablename,
        index: row.indexname,
        indexSize: row.index_size,
        scans: parseInt(row.idx_scan) || 0,
        tuplesRead: parseInt(row.idx_tup_read) || 0,
        tuplesFetched: parseInt(row.idx_tup_fetch) || 0,
        definition: row.index_definition
      }));
    }

    // Check for missing indexes on critical columns
    await this.checkCriticalIndexes();
  }

  async checkCriticalIndexes() {
    console.log('\n🔍 Checking for critical missing indexes...');
    
    const criticalIndexChecks = [
      {
        name: 'Sales Orders Status Index',
        query: `SELECT indexname FROM pg_indexes WHERE tablename = 'sales_orders' AND indexdef LIKE '%status%'`
      },
      {
        name: 'Products Active Status Index', 
        query: `SELECT indexname FROM pg_indexes WHERE tablename = 'products' AND indexdef LIKE '%is_active%'`
      },
      {
        name: 'Invoices Status Index',
        query: `SELECT indexname FROM pg_indexes WHERE tablename = 'invoices' AND indexdef LIKE '%status%'`
      },
      {
        name: 'Inventory Expiry Date Index',
        query: `SELECT indexname FROM pg_indexes WHERE tablename = 'inventory' AND indexdef LIKE '%expiry_date%'`
      },
      {
        name: 'Inventory Quantity Index',
        query: `SELECT indexname FROM pg_indexes WHERE tablename = 'inventory' AND indexdef LIKE '%quantity%'`
      }
    ];

    for (const check of criticalIndexChecks) {
      const result = await this.profileQuery(check.name, check.query);
      if (!result || result.length === 0) {
        this.results.recommendations.push({
          type: 'missing_index',
          priority: 'high',
          issue: `Missing index: ${check.name}`,
          recommendation: `Add index for better dashboard query performance`
        });
      }
    }
  }

  // Test quotations query (identified as slow)
  async profileQuotationsQuery() {
    console.log('\n💰 Profiling Quotations Queries...');
    
    await this.profileQuery(
      'Quotations Simple List',
      `SELECT * FROM quotations ORDER BY created_at DESC LIMIT 100`
    );
    
    // Test if there are any complex joins causing slowness
    await this.profileQuery(
      'Quotations with Customer Info',
      `SELECT q.*, c.name as customer_name 
       FROM quotations q
       LEFT JOIN customers c ON q.customer_id = c.id
       ORDER BY q.created_at DESC 
       LIMIT 100`
    );
  }

  // Test concurrent queries
  async testConcurrentQueries() {
    console.log('\n🚀 Testing Concurrent Dashboard Query Performance...');
    
    const concurrentPromises = [];
    const queryCount = 5;
    
    // Test the actual dashboard metrics query concurrently
    const dashboardQuery = `
      SELECT 
        (SELECT COALESCE(SUM(total_amount), 0) FROM sales_orders WHERE status = 'confirmed') as total_revenue,
        (SELECT COUNT(*) FROM products WHERE is_active = true) as active_products,
        (SELECT COUNT(*) FROM sales_orders WHERE status IN ('draft', 'confirmed')) as open_orders,
        (SELECT COALESCE(SUM(total_amount - paid_amount), 0) FROM invoices WHERE status IN ('sent', 'overdue')) as outstanding_amount,
        (SELECT COUNT(*) FROM inventory WHERE expiry_date <= CURRENT_DATE + INTERVAL '90 days' AND expiry_date > CURRENT_DATE AND quantity >= 1) as expiring_count
    `;
    
    for (let i = 0; i < queryCount; i++) {
      concurrentPromises.push(
        this.profileQuery(`Concurrent Dashboard ${i + 1}`, dashboardQuery)
      );
    }
    
    const startTime = process.hrtime.bigint();
    await Promise.all(concurrentPromises);
    const endTime = process.hrtime.bigint();
    const totalTime = Number(endTime - startTime) / 1000000;
    
    console.log(`✅ ${queryCount} concurrent dashboard queries completed in ${totalTime.toFixed(2)}ms total`);
    
    this.results.concurrentQueryAnalysis = {
      queryCount,
      totalTime,
      avgTimePerQuery: totalTime / queryCount
    };
  }

  // Generate optimization recommendations
  generateRecommendations() {
    console.log('\n💡 Generating Database Optimization Recommendations...');
    
    const recommendations = [...this.results.recommendations]; // Start with any existing recommendations
    
    // Check for slow queries
    if (this.results.slowQueries.length > 0) {
      recommendations.push({
        type: 'slow_queries',
        priority: 'high',
        issue: `Found ${this.results.slowQueries.length} queries taking >1000ms`,
        recommendation: 'Optimize these queries with proper indexing or query restructuring',
        queries: this.results.slowQueries.map(q => q.name)
      });
    }
    
    // Dashboard-specific optimization
    const dashboardQueries = Object.values(this.results.queryAnalysis).filter(q => 
      q.name.includes('Dashboard') && q.success && q.duration > 100
    );
    
    if (dashboardQueries.length > 0) {
      const avgDashboardTime = dashboardQueries.reduce((sum, q) => sum + q.duration, 0) / dashboardQueries.length;
      
      if (avgDashboardTime > 200) {
        recommendations.push({
          type: 'dashboard_caching',
          priority: 'high',
          issue: `Dashboard queries average ${avgDashboardTime.toFixed(2)}ms, degrading under concurrent load`,
          recommendation: 'Implement Redis caching for dashboard metrics with 5-minute TTL',
          impact: 'Could reduce dashboard load time from ~600ms to ~50ms'
        });
      }
    }
    
    // Concurrent query performance
    if (this.results.concurrentQueryAnalysis && this.results.concurrentQueryAnalysis.avgTimePerQuery > 1000) {
      recommendations.push({
        type: 'concurrency_optimization',
        priority: 'high',
        issue: 'Dashboard queries perform poorly under concurrent load',
        recommendation: 'Add connection pooling optimizations and consider query result caching',
        metrics: `Concurrent avg: ${this.results.concurrentQueryAnalysis.avgTimePerQuery.toFixed(2)}ms`
      });
    }
    
    // Table statistics recommendations
    const tablesWithDeadTuples = this.results.tableStats?.filter(t => t.deadRows > t.liveRows * 0.1) || [];
    if (tablesWithDeadTuples.length > 0) {
      recommendations.push({
        type: 'maintenance',
        priority: 'medium',
        issue: `${tablesWithDeadTuples.length} tables have high dead tuple ratios`,
        recommendation: 'Schedule regular VACUUM ANALYZE operations',
        tables: tablesWithDeadTuples.map(t => t.table)
      });
    }
    
    this.results.recommendations = recommendations;
    
    // Print recommendations
    console.log('\n📋 OPTIMIZATION RECOMMENDATIONS:');
    recommendations.forEach((rec, index) => {
      console.log(`\n${index + 1}. [${rec.priority.toUpperCase()}] ${rec.issue}`);
      console.log(`   💡 ${rec.recommendation}`);
      if (rec.impact) console.log(`   📈 Expected Impact: ${rec.impact}`);
      if (rec.queries) console.log(`   📊 Affected: ${rec.queries.join(', ')}`);
      if (rec.tables) console.log(`   📋 Tables: ${rec.tables.join(', ')}`);
    });
  }

  // Run comprehensive database profiling
  async runComprehensiveProfile() {
    console.log('🎯 Starting Database Performance Profiling');
    console.log('==========================================\n');

    try {
      await this.initialize();
      
      // Core profiling tasks
      await this.analyzeTableStats();
      await this.analyzeIndexUsage();
      await this.profileDashboardQueries();
      await this.profileQuotationsQuery();
      await this.testConcurrentQueries();
      
      // Generate recommendations
      this.generateRecommendations();
      
      console.log('\n🎉 Database Profiling Complete!');
      return this.results;
      
    } catch (error) {
      console.error('❌ Database profiling failed:', error);
      throw error;
    } finally {
      if (this.pool) {
        await this.pool.end();
      }
    }
  }

  // Save results to file
  saveResults(filename = `db-profile-results-${Date.now()}.json`) {
    fs.writeFileSync(filename, JSON.stringify(this.results, null, 2));
    console.log(`📄 Database profile results saved to ${filename}`);
    return filename;
  }

  // Generate human-readable report
  generateReport() {
    const report = [`
🎯 DATABASE PERFORMANCE PROFILE REPORT
=====================================
Profile Date: ${this.results.timestamp}

📊 QUERY PERFORMANCE SUMMARY
----------------------------`];

    // Query performance summary
    const queries = Object.values(this.results.queryAnalysis);
    const successfulQueries = queries.filter(q => q.success);
    
    if (successfulQueries.length > 0) {
      const avgTime = successfulQueries.reduce((sum, q) => sum + q.duration, 0) / successfulQueries.length;
      const slowestQuery = successfulQueries.reduce((max, q) => q.duration > max.duration ? q : max);
      const fastestQuery = successfulQueries.reduce((min, q) => q.duration < min.duration ? q : min);
      
      report.push(`Total Queries Tested: ${queries.length}`);
      report.push(`Successful Queries: ${successfulQueries.length}`);
      report.push(`Average Query Time: ${avgTime.toFixed(2)}ms`);
      report.push(`Slowest Query: ${slowestQuery.name} (${slowestQuery.duration.toFixed(2)}ms)`);
      report.push(`Fastest Query: ${fastestQuery.name} (${fastestQuery.duration.toFixed(2)}ms)`);
    }

    // Dashboard analysis
    const dashboardQueries = successfulQueries.filter(q => q.name.includes('Dashboard'));
    if (dashboardQueries.length > 0) {
      const avgDashboard = dashboardQueries.reduce((sum, q) => sum + q.duration, 0) / dashboardQueries.length;
      report.push(`\n🎛️  DASHBOARD PERFORMANCE:`);
      report.push(`Average Dashboard Query Time: ${avgDashboard.toFixed(2)}ms`);
      dashboardQueries.forEach(q => {
        report.push(`• ${q.name}: ${q.duration.toFixed(2)}ms`);
      });
    }

    // Concurrent query analysis
    if (this.results.concurrentQueryAnalysis) {
      report.push(`\n🚀 CONCURRENT QUERY PERFORMANCE:`);
      report.push(`${this.results.concurrentQueryAnalysis.queryCount} concurrent queries`);
      report.push(`Total Time: ${this.results.concurrentQueryAnalysis.totalTime.toFixed(2)}ms`);
      report.push(`Average per Query: ${this.results.concurrentQueryAnalysis.avgTimePerQuery.toFixed(2)}ms`);
    }

    // Table statistics
    if (this.results.tableStats && this.results.tableStats.length > 0) {
      report.push(`\n📋 TOP TABLES BY SIZE:`);
      this.results.tableStats.slice(0, 10).forEach(table => {
        report.push(`• ${table.table}: ${table.liveRows.toLocaleString()} rows (${table.deadRows} dead)`);
      });
    }

    // Recommendations
    if (this.results.recommendations.length > 0) {
      report.push(`\n💡 OPTIMIZATION RECOMMENDATIONS:`);
      this.results.recommendations.forEach((rec, index) => {
        report.push(`\n${index + 1}. [${rec.priority.toUpperCase()}] ${rec.issue}`);
        report.push(`   Solution: ${rec.recommendation}`);
        if (rec.impact) report.push(`   Impact: ${rec.impact}`);
      });
    }

    return report.join('\n');
  }
}

// Main execution
async function main() {
  const profiler = new SimpleDatabaseProfiler();
  
  try {
    const results = await profiler.runComprehensiveProfile();
    
    // Save detailed results
    const resultsFile = profiler.saveResults();
    
    // Generate and save human-readable report
    const report = profiler.generateReport();
    const reportFile = `db-profile-report-${Date.now()}.txt`;
    fs.writeFileSync(reportFile, report);
    
    console.log(`\n📄 Database profile report saved to ${reportFile}`);
    console.log('\n' + '='.repeat(60));
    console.log(report);
    
  } catch (error) {
    console.error('❌ Database profiling failed:', error);
    process.exit(1);
  }
}

// Export for use as module
export default SimpleDatabaseProfiler;

// Run if called directly
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] === __filename) {
  main();
}