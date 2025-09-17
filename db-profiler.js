#!/usr/bin/env node

/**
 * Database Query Profiler for Pharmaceutical ERP/CRM
 * Profiles database queries to identify performance bottlenecks
 */

import { getDb } from './server/db.js';
import fs from 'fs';

class DatabaseProfiler {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      queryAnalysis: {},
      tableStats: {},
      indexAnalysis: {},
      slowQueries: [],
      recommendations: []
    };
    this.db = null;
  }

  async initialize() {
    this.db = await getDb();
    console.log('🔗 Database connection established for profiling');
  }

  // Execute SQL and measure performance
  async profileQuery(name, sql, params = []) {
    const startTime = process.hrtime.bigint();
    
    try {
      const result = await this.db.execute(sql, params);
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // Convert to ms
      
      const analysis = {
        name,
        sql: sql.replace(/\s+/g, ' ').trim(),
        duration,
        rowCount: Array.isArray(result) ? result.length : (result.rowCount || 0),
        success: true
      };

      console.log(`✅ ${name}: ${duration.toFixed(2)}ms (${analysis.rowCount} rows)`);
      this.results.queryAnalysis[name] = analysis;
      
      if (duration > 1000) {
        this.results.slowQueries.push(analysis);
      }
      
      return result;
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

  // Analyze table statistics
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
        liveRows: parseInt(row.live_tuples) || 0,
        deadRows: parseInt(row.dead_tuples) || 0,
        inserts: parseInt(row.inserts) || 0,
        updates: parseInt(row.updates) || 0,
        deletes: parseInt(row.deletes) || 0,
        lastVacuum: row.last_vacuum,
        lastAnalyze: row.last_analyze
      }));
    }
  }

  // Analyze index usage
  async analyzeIndexUsage() {
    console.log('\n🔍 Analyzing index usage...');
    
    const indexUsageQuery = `
      SELECT 
        t.tablename,
        indexname,
        c.reltuples::bigint AS num_rows,
        pg_size_pretty(pg_relation_size(c.oid)) AS table_size,
        pg_size_pretty(pg_relation_size(i.indexrelid)) AS index_size,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch
      FROM pg_stat_user_indexes s
      JOIN pg_stat_user_tables t ON s.relid = t.relid
      JOIN pg_class c ON c.oid = s.relid
      JOIN pg_index i ON i.indexrelid = s.indexrelid
      ORDER BY idx_scan DESC;
    `;
    
    const indexes = await this.profileQuery('Index Usage Analysis', indexUsageQuery);
    
    if (indexes) {
      this.results.indexAnalysis = indexes.map(row => ({
        table: row.tablename,
        index: row.indexname,
        numRows: parseInt(row.num_rows) || 0,
        tableSize: row.table_size,
        indexSize: row.index_size,
        scans: parseInt(row.idx_scan) || 0,
        tuplesRead: parseInt(row.idx_tup_read) || 0,
        tuplesFetched: parseInt(row.idx_tup_fetch) || 0
      }));
    }
  }

  // Test dashboard metrics queries (the slow endpoint)
  async profileDashboardQueries() {
    console.log('\n📈 Profiling Dashboard Queries...');
    
    // Revenue calculation query
    await this.profileQuery(
      'Dashboard Total Revenue',
      `SELECT COALESCE(SUM(total), 0) as total_revenue 
       FROM invoices 
       WHERE status = 'paid'`
    );
    
    // Active products count
    await this.profileQuery(
      'Dashboard Active Products',
      `SELECT COUNT(*) as active_products 
       FROM products 
       WHERE status = 'active'`
    );
    
    // Open orders count
    await this.profileQuery(
      'Dashboard Open Orders',
      `SELECT COUNT(*) as open_orders 
       FROM sales_orders 
       WHERE status IN ('pending', 'confirmed', 'processing')`
    );
    
    // Outstanding amount
    await this.profileQuery(
      'Dashboard Outstanding Amount',
      `SELECT COALESCE(SUM(total), 0) as outstanding_amount 
       FROM invoices 
       WHERE status IN ('pending', 'overdue')`
    );
    
    // Expiring products count
    await this.profileQuery(
      'Dashboard Expiring Products Count',
      `SELECT COUNT(*) as expiring_count 
       FROM inventory i
       JOIN products p ON i.product_id = p.id
       WHERE i.expiry_date <= CURRENT_DATE + INTERVAL '90 days'
       AND i.expiry_date > CURRENT_DATE
       AND i.quantity > 0`
    );
  }

  // Profile business data queries
  async profileBusinessDataQueries() {
    console.log('\n💼 Profiling Business Data Queries...');
    
    // Customer queries
    await this.profileQuery(
      'Customer List Query',
      `SELECT * FROM customers ORDER BY created_at DESC LIMIT 100`
    );
    
    // Product queries with joins
    await this.profileQuery(
      'Product List Query',
      `SELECT * FROM products ORDER BY created_at DESC LIMIT 100`
    );
    
    // Inventory with joins
    await this.profileQuery(
      'Inventory Query with Joins',
      `SELECT i.*, p.name as product_name, p.sku, w.name as warehouse_name
       FROM inventory i
       JOIN products p ON i.product_id = p.id
       JOIN warehouses w ON i.warehouse_id = w.id
       ORDER BY i.created_at DESC
       LIMIT 100`
    );
    
    // Sales orders with customer info
    await this.profileQuery(
      'Sales Orders with Customer',
      `SELECT so.*, c.name as customer_name, u.name as sales_rep_name
       FROM sales_orders so
       JOIN customers c ON so.customer_id = c.id
       LEFT JOIN users u ON so.sales_rep_id = u.id
       ORDER BY so.created_at DESC
       LIMIT 100`
    );
    
    // Purchase orders with supplier info
    await this.profileQuery(
      'Purchase Orders with Supplier',
      `SELECT po.*, s.name as supplier_name
       FROM purchase_orders po
       JOIN suppliers s ON po.supplier_id = s.id
       ORDER BY po.created_at DESC
       LIMIT 100`
    );
  }

  // Profile quotations query (the slow one)
  async profileQuotationsQuery() {
    console.log('\n💰 Profiling Quotations Queries...');
    
    await this.profileQuery(
      'Quotations List Query',
      `SELECT * FROM quotations ORDER BY created_at DESC LIMIT 100`
    );
    
    await this.profileQuery(
      'Quotations with Customer and Items',
      `SELECT q.*, c.name as customer_name, 
              COUNT(qi.id) as item_count,
              SUM(qi.quantity * qi.unit_price) as total_value
       FROM quotations q
       JOIN customers c ON q.customer_id = c.id
       LEFT JOIN quotation_items qi ON q.id = qi.quotation_id
       GROUP BY q.id, c.name
       ORDER BY q.created_at DESC
       LIMIT 100`
    );
  }

  // Profile HR queries
  async profileHRQueries() {
    console.log('\n👥 Profiling HR Queries...');
    
    await this.profileQuery(
      'Employee List Query',
      `SELECT * FROM employees ORDER BY created_at DESC LIMIT 100`
    );
    
    await this.profileQuery(
      'Employee with Department Count',
      `SELECT department, COUNT(*) as employee_count
       FROM employees
       WHERE employment_status = 'active'
       GROUP BY department
       ORDER BY employee_count DESC`
    );
  }

  // Analyze concurrent query performance
  async testConcurrentQueries() {
    console.log('\n🚀 Testing Concurrent Query Performance...');
    
    const concurrentPromises = [];
    const queryCount = 5;
    
    // Test dashboard metrics concurrently (the problematic endpoint)
    for (let i = 0; i < queryCount; i++) {
      concurrentPromises.push(
        this.profileQuery(
          `Concurrent Dashboard Query ${i + 1}`,
          `SELECT 
             COALESCE((SELECT SUM(total) FROM invoices WHERE status = 'paid'), 0) as total_revenue,
             (SELECT COUNT(*) FROM products WHERE status = 'active') as active_products,
             (SELECT COUNT(*) FROM sales_orders WHERE status IN ('pending', 'confirmed', 'processing')) as open_orders,
             COALESCE((SELECT SUM(total) FROM invoices WHERE status IN ('pending', 'overdue')), 0) as outstanding_amount`
        )
      );
    }
    
    const startTime = process.hrtime.bigint();
    await Promise.all(concurrentPromises);
    const endTime = process.hrtime.bigint();
    const totalTime = Number(endTime - startTime) / 1000000;
    
    console.log(`✅ Concurrent queries completed in ${totalTime.toFixed(2)}ms total`);
    
    this.results.concurrentQueryAnalysis = {
      queryCount,
      totalTime,
      avgTimePerQuery: totalTime / queryCount
    };
  }

  // Generate optimization recommendations
  generateRecommendations() {
    console.log('\n💡 Generating Optimization Recommendations...');
    
    const recommendations = [];
    
    // Check for slow queries
    if (this.results.slowQueries.length > 0) {
      recommendations.push({
        type: 'slow_queries',
        priority: 'high',
        issue: `Found ${this.results.slowQueries.length} queries taking >1000ms`,
        recommendation: 'Add database indexes, optimize joins, or consider query caching',
        queries: this.results.slowQueries.map(q => q.name)
      });
    }
    
    // Check table stats for dead tuples
    const tablesWithDeadTuples = this.results.tableStats?.filter(t => t.deadRows > t.liveRows * 0.1) || [];
    if (tablesWithDeadTuples.length > 0) {
      recommendations.push({
        type: 'maintenance',
        priority: 'medium',
        issue: 'Tables with high dead tuple ratios found',
        recommendation: 'Run VACUUM ANALYZE on these tables',
        tables: tablesWithDeadTuples.map(t => t.table)
      });
    }
    
    // Check for unused indexes
    const unusedIndexes = this.results.indexAnalysis?.filter(i => i.scans === 0) || [];
    if (unusedIndexes.length > 0) {
      recommendations.push({
        type: 'indexes',
        priority: 'low',
        issue: 'Unused indexes found (consuming storage)',
        recommendation: 'Consider dropping unused indexes to save space',
        indexes: unusedIndexes.map(i => `${i.table}.${i.index}`)
      });
    }
    
    // Dashboard-specific recommendations
    const dashboardQueries = Object.values(this.results.queryAnalysis).filter(q => 
      q.name.includes('Dashboard') && q.duration > 100
    );
    if (dashboardQueries.length > 0) {
      recommendations.push({
        type: 'dashboard_performance',
        priority: 'high',
        issue: 'Dashboard queries are slow, especially under concurrent load',
        recommendation: 'Implement dashboard metrics caching (Redis/memory cache) with 5-minute expiry',
        affectedQueries: dashboardQueries.map(q => q.name)
      });
    }
    
    this.results.recommendations = recommendations;
    
    // Print recommendations
    recommendations.forEach((rec, index) => {
      console.log(`\n${index + 1}. [${rec.priority.toUpperCase()}] ${rec.issue}`);
      console.log(`   💡 ${rec.recommendation}`);
      if (rec.queries) console.log(`   📊 Affected queries: ${rec.queries.join(', ')}`);
      if (rec.tables) console.log(`   📋 Affected tables: ${rec.tables.join(', ')}`);
      if (rec.indexes) console.log(`   🔍 Affected indexes: ${rec.indexes.join(', ')}`);
    });
  }

  // Run comprehensive database profiling
  async runComprehensiveProfile() {
    console.log('🎯 Starting Comprehensive Database Profiling');
    console.log('=============================================\n');

    try {
      await this.initialize();
      
      // Core profiling tasks
      await this.analyzeTableStats();
      await this.analyzeIndexUsage();
      await this.profileDashboardQueries();
      await this.profileBusinessDataQueries();
      await this.profileQuotationsQuery();
      await this.profileHRQueries();
      await this.testConcurrentQueries();
      
      // Generate recommendations
      this.generateRecommendations();
      
      console.log('\n🎉 Database Profiling Complete!');
      return this.results;
      
    } catch (error) {
      console.error('❌ Database profiling failed:', error);
      throw error;
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

    // Slow queries section
    if (this.results.slowQueries.length > 0) {
      report.push(`\n⚠️  SLOW QUERIES (>1000ms)\n${'='.repeat(30)}`);
      this.results.slowQueries.forEach(q => {
        report.push(`• ${q.name}: ${q.duration.toFixed(2)}ms`);
      });
    }

    // Table statistics
    if (this.results.tableStats && this.results.tableStats.length > 0) {
      report.push(`\n📋 TABLE STATISTICS\n${'='.repeat(19)}`);
      this.results.tableStats.slice(0, 10).forEach(table => {
        report.push(`• ${table.table}: ${table.liveRows.toLocaleString()} rows (${table.deadRows} dead)`);
      });
    }

    // Recommendations
    if (this.results.recommendations.length > 0) {
      report.push(`\n💡 OPTIMIZATION RECOMMENDATIONS\n${'='.repeat(32)}`);
      this.results.recommendations.forEach((rec, index) => {
        report.push(`\n${index + 1}. [${rec.priority.toUpperCase()}] ${rec.issue}`);
        report.push(`   Solution: ${rec.recommendation}`);
      });
    }

    // Concurrent query results
    if (this.results.concurrentQueryAnalysis) {
      report.push(`\n🚀 CONCURRENT QUERY PERFORMANCE\n${'='.repeat(32)}`);
      report.push(`Concurrent Queries: ${this.results.concurrentQueryAnalysis.queryCount}`);
      report.push(`Total Time: ${this.results.concurrentQueryAnalysis.totalTime.toFixed(2)}ms`);
      report.push(`Average per Query: ${this.results.concurrentQueryAnalysis.avgTimePerQuery.toFixed(2)}ms`);
    }

    return report.join('\n');
  }
}

// Main execution
async function main() {
  const profiler = new DatabaseProfiler();
  
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
export default DatabaseProfiler;

// Run if called directly
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] === __filename) {
  main();
}