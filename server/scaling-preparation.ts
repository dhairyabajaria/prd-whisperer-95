/**
 * Phase 3: Infrastructure Scaling Preparation
 * 
 * Implements horizontal scaling patterns, load balancing preparation,
 * and container orchestration readiness for enterprise pharmaceutical ERP
 * 
 * Target: Support 1000+ concurrent users with horizontal scaling architecture
 */

import { EventEmitter } from 'events';
import { advancedCache } from './advanced-cache-system';
import { replicaManager } from './read-replica-strategy';
import { performanceMonitor } from './performance-monitoring';

// ===============================
// LOAD BALANCING CONFIGURATION
// ===============================

interface LoadBalancerConfig {
  algorithm: 'round_robin' | 'weighted_round_robin' | 'least_connections' | 'ip_hash';
  healthCheckInterval: number;
  failoverTimeout: number;
  maxRetries: number;
  sessionAffinity: boolean;
}

interface ServerNode {
  id: string;
  hostname: string;
  port: number;
  weight: number;
  isHealthy: boolean;
  activeConnections: number;
  totalRequests: number;
  responseTime: number;
  lastHealthCheck: number;
  metadata: {
    region?: string;
    datacenter?: string;
    capabilities: string[];
  };
}

const DEFAULT_LB_CONFIG: LoadBalancerConfig = {
  algorithm: 'least_connections',
  healthCheckInterval: 30000, // 30 seconds
  failoverTimeout: 5000,      // 5 seconds
  maxRetries: 3,
  sessionAffinity: true       // For stateful sessions
};

// ===============================
// HORIZONTAL SCALING MANAGER
// ===============================

class HorizontalScalingManager extends EventEmitter {
  private nodes = new Map<string, ServerNode>();
  private loadBalancerConfig: LoadBalancerConfig;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private scalingMetrics = new Map<string, {
    timestamp: number;
    cpuUsage: number;
    memoryUsage: number;
    requestRate: number;
    responseTime: number;
  }>();

  constructor(config: Partial<LoadBalancerConfig> = {}) {
    super();
    this.loadBalancerConfig = { ...DEFAULT_LB_CONFIG, ...config };
    this.initializeScaling();
  }

  private initializeScaling(): void {
    console.log('🚀 [Scaling Manager] Initializing horizontal scaling infrastructure...');
    
    // Register current node as primary
    this.registerNode({
      id: 'primary',
      hostname: process.env.HOSTNAME || 'localhost',
      port: parseInt(process.env.PORT || '3000'),
      weight: 100,
      isHealthy: true,
      activeConnections: 0,
      totalRequests: 0,
      responseTime: 0,
      lastHealthCheck: Date.now(),
      metadata: {
        region: process.env.REGION || 'primary',
        datacenter: process.env.DATACENTER || 'main',
        capabilities: ['api', 'database', 'cache', 'auth']
      }
    });

    // Start health monitoring
    this.startHealthMonitoring();
    
    // Start metrics collection
    this.startMetricsCollection();
  }

  /**
   * Register a new server node for load balancing
   */
  registerNode(node: ServerNode): void {
    this.nodes.set(node.id, { ...node });
    console.log(`📍 [Node Registration] Added node ${node.id} (${node.hostname}:${node.port})`);
    this.emit('nodeAdded', node);
  }

  /**
   * Remove a server node from load balancing
   */
  unregisterNode(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      this.nodes.delete(nodeId);
      console.log(`📍 [Node Removal] Removed node ${nodeId}`);
      this.emit('nodeRemoved', node);
    }
  }

  /**
   * Select optimal server node based on load balancing algorithm
   */
  selectNode(sessionId?: string): ServerNode | null {
    const healthyNodes = Array.from(this.nodes.values()).filter(node => node.isHealthy);
    
    if (healthyNodes.length === 0) {
      console.warn('⚠️  [Load Balancer] No healthy nodes available');
      return null;
    }

    switch (this.loadBalancerConfig.algorithm) {
      case 'round_robin':
        return this.roundRobinSelection(healthyNodes);
      
      case 'weighted_round_robin':
        return this.weightedRoundRobinSelection(healthyNodes);
      
      case 'least_connections':
        return this.leastConnectionsSelection(healthyNodes);
      
      case 'ip_hash':
        return this.ipHashSelection(healthyNodes, sessionId || '');
      
      default:
        return healthyNodes[0]; // Fallback to first healthy node
    }
  }

  private roundRobinSelection(nodes: ServerNode[]): ServerNode {
    // Simple round-robin based on total requests
    return nodes.reduce((prev, current) => 
      prev.totalRequests <= current.totalRequests ? prev : current
    );
  }

  private weightedRoundRobinSelection(nodes: ServerNode[]): ServerNode {
    // Select node based on weight and current load
    let bestNode = nodes[0];
    let bestScore = this.calculateWeightedScore(bestNode);
    
    for (const node of nodes.slice(1)) {
      const score = this.calculateWeightedScore(node);
      if (score > bestScore) {
        bestScore = score;
        bestNode = node;
      }
    }
    
    return bestNode;
  }

  private calculateWeightedScore(node: ServerNode): number {
    // Higher weight and lower connections = higher score
    const connectionRatio = node.activeConnections / (node.weight || 1);
    const responseTimeScore = Math.max(0, 1000 - node.responseTime) / 1000;
    return (node.weight * responseTimeScore) / (connectionRatio + 1);
  }

  private leastConnectionsSelection(nodes: ServerNode[]): ServerNode {
    return nodes.reduce((prev, current) => 
      prev.activeConnections <= current.activeConnections ? prev : current
    );
  }

  private ipHashSelection(nodes: ServerNode[], sessionId: string): ServerNode {
    // Simple hash-based selection for session affinity
    let hash = 0;
    for (let i = 0; i < sessionId.length; i++) {
      hash = ((hash << 5) - hash) + sessionId.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    return nodes[Math.abs(hash) % nodes.length];
  }

  // ===============================
  // AUTO-SCALING LOGIC
  // ===============================

  /**
   * Evaluate scaling requirements based on current metrics
   */
  evaluateScalingNeeds(): {
    shouldScaleUp: boolean;
    shouldScaleDown: boolean;
    recommendedNodes: number;
    reason: string;
    metrics: {
      avgCpuUsage: number;
      avgMemoryUsage: number;
      avgResponseTime: number;
      requestRate: number;
    };
  } {
    const healthyNodes = Array.from(this.nodes.values()).filter(n => n.isHealthy);
    const recentMetrics = Array.from(this.scalingMetrics.values())
      .filter(m => Date.now() - m.timestamp < 300000) // Last 5 minutes
      .slice(-20); // Last 20 data points
    
    if (recentMetrics.length < 3) {
      return {
        shouldScaleUp: false,
        shouldScaleDown: false,
        recommendedNodes: healthyNodes.length,
        reason: 'Insufficient metrics data',
        metrics: { avgCpuUsage: 0, avgMemoryUsage: 0, avgResponseTime: 0, requestRate: 0 }
      };
    }

    // Calculate averages
    const avgCpuUsage = recentMetrics.reduce((sum, m) => sum + m.cpuUsage, 0) / recentMetrics.length;
    const avgMemoryUsage = recentMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / recentMetrics.length;
    const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length;
    const requestRate = recentMetrics.reduce((sum, m) => sum + m.requestRate, 0) / recentMetrics.length;

    // Scaling thresholds
    const HIGH_CPU_THRESHOLD = 70;
    const HIGH_MEMORY_THRESHOLD = 80;
    const HIGH_RESPONSE_TIME_THRESHOLD = 500; // ms
    const LOW_CPU_THRESHOLD = 20;
    const LOW_MEMORY_THRESHOLD = 30;
    const MIN_NODES = 1;
    const MAX_NODES = 10;

    let shouldScaleUp = false;
    let shouldScaleDown = false;
    let reason = 'Metrics within normal range';
    let recommendedNodes = healthyNodes.length;

    // Scale up conditions
    if (avgCpuUsage > HIGH_CPU_THRESHOLD || 
        avgMemoryUsage > HIGH_MEMORY_THRESHOLD || 
        avgResponseTime > HIGH_RESPONSE_TIME_THRESHOLD) {
      
      shouldScaleUp = true;
      recommendedNodes = Math.min(healthyNodes.length + 1, MAX_NODES);
      
      if (avgCpuUsage > HIGH_CPU_THRESHOLD) reason = `High CPU usage: ${avgCpuUsage.toFixed(1)}%`;
      else if (avgMemoryUsage > HIGH_MEMORY_THRESHOLD) reason = `High memory usage: ${avgMemoryUsage.toFixed(1)}%`;
      else reason = `High response time: ${avgResponseTime.toFixed(0)}ms`;
    }
    // Scale down conditions
    else if (healthyNodes.length > MIN_NODES &&
             avgCpuUsage < LOW_CPU_THRESHOLD && 
             avgMemoryUsage < LOW_MEMORY_THRESHOLD && 
             avgResponseTime < 200) {
      
      shouldScaleDown = true;
      recommendedNodes = Math.max(healthyNodes.length - 1, MIN_NODES);
      reason = `Low resource utilization - CPU: ${avgCpuUsage.toFixed(1)}%, Memory: ${avgMemoryUsage.toFixed(1)}%`;
    }

    return {
      shouldScaleUp,
      shouldScaleDown,
      recommendedNodes,
      reason,
      metrics: {
        avgCpuUsage: Math.round(avgCpuUsage * 100) / 100,
        avgMemoryUsage: Math.round(avgMemoryUsage * 100) / 100,
        avgResponseTime: Math.round(avgResponseTime * 100) / 100,
        requestRate: Math.round(requestRate * 100) / 100
      }
    };
  }

  // ===============================
  // HEALTH MONITORING
  // ===============================

  private startHealthMonitoring(): void {
    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthChecks();
    }, this.loadBalancerConfig.healthCheckInterval);

    // Cleanup on exit
    process.on('exit', () => {
      if (this.healthCheckTimer) {
        clearInterval(this.healthCheckTimer);
      }
    });
  }

  private async performHealthChecks(): Promise<void> {
    const promises = Array.from(this.nodes.entries()).map(async ([nodeId, node]) => {
      try {
        const startTime = Date.now();
        
        // Health check implementation would depend on your specific setup
        // For now, we'll simulate health checks
        const isHealthy = await this.checkNodeHealth(node);
        const responseTime = Date.now() - startTime;
        
        // Update node status
        node.isHealthy = isHealthy;
        node.responseTime = (node.responseTime * 0.7) + (responseTime * 0.3); // Smooth average
        node.lastHealthCheck = Date.now();
        
        if (!isHealthy) {
          console.warn(`⚠️  [Health Check] Node ${nodeId} is unhealthy`);
          this.emit('nodeUnhealthy', node);
        }
        
      } catch (error) {
        console.error(`❌ [Health Check] Failed for node ${nodeId}:`, error);
        node.isHealthy = false;
        this.emit('nodeUnhealthy', node);
      }
    });

    await Promise.allSettled(promises);
  }

  private async checkNodeHealth(node: ServerNode): Promise<boolean> {
    // This would typically make an HTTP request to the node's health endpoint
    // For demonstration, we'll use basic logic
    
    if (node.id === 'primary') {
      // Check current process health
      const memUsage = process.memoryUsage();
      const heapUsage = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      
      return heapUsage < 90; // Unhealthy if heap usage > 90%
    }
    
    // For other nodes, you would make actual HTTP health check requests
    return true;
  }

  private startMetricsCollection(): void {
    setInterval(async () => {
      await this.collectScalingMetrics();
    }, 30000); // Collect every 30 seconds
  }

  private async collectScalingMetrics(): Promise<void> {
    try {
      // Get system metrics
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      // Calculate CPU percentage (approximation)
      const cpuPercent = Math.min((cpuUsage.user + cpuUsage.system) / 10000, 100);
      
      // Calculate memory percentage
      const memPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      
      // Get request rate from performance monitor
      const perfSummary = performanceMonitor.getApiPerformanceSummary(60000); // Last minute
      const requestRate = perfSummary.totalRequests / 60; // Requests per second
      const responseTime = perfSummary.averageResponseTime;
      
      // Store metrics
      this.scalingMetrics.set(Date.now().toString(), {
        timestamp: Date.now(),
        cpuUsage: cpuPercent,
        memoryUsage: memPercent,
        requestRate,
        responseTime
      });
      
      // Clean old metrics (keep last hour)
      const cutoff = Date.now() - 3600000;
      for (const [key, metrics] of this.scalingMetrics.entries()) {
        if (metrics.timestamp < cutoff) {
          this.scalingMetrics.delete(key);
        }
      }
      
      // Evaluate scaling needs
      const scalingEvaluation = this.evaluateScalingNeeds();
      
      if (scalingEvaluation.shouldScaleUp) {
        console.log(`📈 [Auto-Scaling] Scale-up recommended: ${scalingEvaluation.reason}`);
        this.emit('scaleUpRecommended', scalingEvaluation);
      } else if (scalingEvaluation.shouldScaleDown) {
        console.log(`📉 [Auto-Scaling] Scale-down recommended: ${scalingEvaluation.reason}`);
        this.emit('scaleDownRecommended', scalingEvaluation);
      }
      
    } catch (error) {
      console.error('❌ [Metrics Collection] Failed:', error);
    }
  }

  // ===============================
  // CONTAINER ORCHESTRATION SUPPORT
  // ===============================

  /**
   * Generate Kubernetes deployment configuration
   */
  generateKubernetesConfig(): {
    deployment: any;
    service: any;
    horizontalPodAutoscaler: any;
    configMap: any;
  } {
    return {
      deployment: {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: {
          name: 'pharmaceutical-erp',
          labels: {
            app: 'pharmaceutical-erp',
            version: '3.0.0',
            tier: 'backend'
          }
        },
        spec: {
          replicas: 3,
          selector: {
            matchLabels: {
              app: 'pharmaceutical-erp'
            }
          },
          template: {
            metadata: {
              labels: {
                app: 'pharmaceutical-erp'
              }
            },
            spec: {
              containers: [{
                name: 'erp-backend',
                image: 'pharmaceutical-erp:latest',
                ports: [{
                  containerPort: 3000,
                  name: 'http'
                }],
                env: [
                  {
                    name: 'DATABASE_URL',
                    valueFrom: {
                      secretKeyRef: {
                        name: 'erp-secrets',
                        key: 'database-url'
                      }
                    }
                  },
                  {
                    name: 'REDIS_HOST',
                    value: 'redis-service'
                  },
                  {
                    name: 'NODE_ENV',
                    value: 'production'
                  }
                ],
                resources: {
                  requests: {
                    memory: '512Mi',
                    cpu: '250m'
                  },
                  limits: {
                    memory: '1Gi',
                    cpu: '500m'
                  }
                },
                livenessProbe: {
                  httpGet: {
                    path: '/api/health',
                    port: 3000
                  },
                  initialDelaySeconds: 30,
                  periodSeconds: 10
                },
                readinessProbe: {
                  httpGet: {
                    path: '/api/health',
                    port: 3000
                  },
                  initialDelaySeconds: 5,
                  periodSeconds: 5
                }
              }]
            }
          }
        }
      },
      
      service: {
        apiVersion: 'v1',
        kind: 'Service',
        metadata: {
          name: 'pharmaceutical-erp-service'
        },
        spec: {
          selector: {
            app: 'pharmaceutical-erp'
          },
          ports: [{
            protocol: 'TCP',
            port: 80,
            targetPort: 3000
          }],
          type: 'LoadBalancer'
        }
      },
      
      horizontalPodAutoscaler: {
        apiVersion: 'autoscaling/v2',
        kind: 'HorizontalPodAutoscaler',
        metadata: {
          name: 'pharmaceutical-erp-hpa'
        },
        spec: {
          scaleTargetRef: {
            apiVersion: 'apps/v1',
            kind: 'Deployment',
            name: 'pharmaceutical-erp'
          },
          minReplicas: 2,
          maxReplicas: 10,
          metrics: [
            {
              type: 'Resource',
              resource: {
                name: 'cpu',
                target: {
                  type: 'Utilization',
                  averageUtilization: 70
                }
              }
            },
            {
              type: 'Resource',
              resource: {
                name: 'memory',
                target: {
                  type: 'Utilization',
                  averageUtilization: 80
                }
              }
            }
          ]
        }
      },
      
      configMap: {
        apiVersion: 'v1',
        kind: 'ConfigMap',
        metadata: {
          name: 'erp-config'
        },
        data: {
          'load-balancer.json': JSON.stringify(this.loadBalancerConfig, null, 2),
          'scaling-thresholds.json': JSON.stringify({
            scaleUp: {
              cpuThreshold: 70,
              memoryThreshold: 80,
              responseTimeThreshold: 500
            },
            scaleDown: {
              cpuThreshold: 20,
              memoryThreshold: 30,
              responseTimeThreshold: 200
            }
          }, null, 2)
        }
      }
    };
  }

  /**
   * Get comprehensive scaling status
   */
  getScalingStatus(): {
    nodes: Array<{
      id: string;
      hostname: string;
      port: number;
      isHealthy: boolean;
      activeConnections: number;
      responseTime: number;
      weight: number;
    }>;
    loadBalancer: {
      algorithm: string;
      totalNodes: number;
      healthyNodes: number;
      totalRequests: number;
    };
    scaling: ReturnType<typeof this.evaluateScalingNeeds>;
    recommendations: {
      immediate: string[];
      shortTerm: string[];
      longTerm: string[];
    };
  } {
    const healthyNodes = Array.from(this.nodes.values()).filter(n => n.isHealthy);
    const totalRequests = Array.from(this.nodes.values()).reduce((sum, n) => sum + n.totalRequests, 0);
    
    const scaling = this.evaluateScalingNeeds();
    
    // Generate recommendations
    const recommendations = {
      immediate: [],
      shortTerm: [],
      longTerm: []
    } as {
      immediate: string[];
      shortTerm: string[];
      longTerm: string[];
    };

    if (scaling.shouldScaleUp) {
      recommendations.immediate.push(`Add ${scaling.recommendedNodes - healthyNodes.length} server node(s) - ${scaling.reason}`);
    }

    if (healthyNodes.length === 1) {
      recommendations.shortTerm.push('Set up additional server nodes for high availability');
    }

    if (scaling.metrics.avgResponseTime > 300) {
      recommendations.shortTerm.push('Optimize database queries and implement additional caching');
    }

    recommendations.longTerm.push('Consider implementing container orchestration (Kubernetes)');
    recommendations.longTerm.push('Set up monitoring and alerting for scaling events');

    return {
      nodes: Array.from(this.nodes.values()).map(node => ({
        id: node.id,
        hostname: node.hostname,
        port: node.port,
        isHealthy: node.isHealthy,
        activeConnections: node.activeConnections,
        responseTime: Math.round(node.responseTime),
        weight: node.weight
      })),
      loadBalancer: {
        algorithm: this.loadBalancerConfig.algorithm,
        totalNodes: this.nodes.size,
        healthyNodes: healthyNodes.length,
        totalRequests
      },
      scaling,
      recommendations
    };
  }
}

// ===============================
// REQUEST DISTRIBUTION MIDDLEWARE
// ===============================

export function createLoadBalancerMiddleware(scalingManager: HorizontalScalingManager) {
  return (req: any, res: any, next: any) => {
    // Track request start
    const startTime = Date.now();
    
    // Select optimal node (in a real implementation, this would route the request)
    const sessionId = req.session?.id || req.ip;
    const selectedNode = scalingManager.selectNode(sessionId);
    
    if (selectedNode) {
      // Update connection count
      selectedNode.activeConnections++;
      selectedNode.totalRequests++;
      
      // Add node info to request for debugging
      req.selectedNode = selectedNode.id;
      
      // Track request completion
      const originalEnd = res.end;
      res.end = function(...args: any[]) {
        const duration = Date.now() - startTime;
        
        // Update node metrics
        selectedNode.activeConnections--;
        selectedNode.responseTime = (selectedNode.responseTime * 0.9) + (duration * 0.1);
        
        return originalEnd.apply(this, args);
      };
    }
    
    next();
  };
}

// ===============================
// EXPORTS
// ===============================

export const scalingManager = new HorizontalScalingManager();

// Event handlers for scaling events
scalingManager.on('scaleUpRecommended', (evaluation) => {
  console.log(`🚀 [Auto-Scaling] SCALE UP RECOMMENDED: ${evaluation.reason}`);
  // In a real implementation, this would trigger actual scaling actions
});

scalingManager.on('scaleDownRecommended', (evaluation) => {
  console.log(`📉 [Auto-Scaling] SCALE DOWN RECOMMENDED: ${evaluation.reason}`);
  // In a real implementation, this would trigger actual scaling actions
});

scalingManager.on('nodeUnhealthy', (node) => {
  console.warn(`⚠️  [Health Alert] Node ${node.id} is unhealthy - redistributing load`);
});

// Helper functions
export function getScalingRecommendations(): ReturnType<typeof scalingManager.getScalingStatus> {
  return scalingManager.getScalingStatus();
}

export function generateKubernetesManifests(): string {
  const config = scalingManager.generateKubernetesConfig();
  
  const manifests = [
    '# Kubernetes Deployment Configuration',
    '# Generated by Pharmaceutical ERP Scaling System',
    '',
    '# Deployment',
    '---',
    JSON.stringify(config.deployment, null, 2),
    '',
    '# Service',
    '---', 
    JSON.stringify(config.service, null, 2),
    '',
    '# Horizontal Pod Autoscaler',
    '---',
    JSON.stringify(config.horizontalPodAutoscaler, null, 2),
    '',
    '# ConfigMap',
    '---',
    JSON.stringify(config.configMap, null, 2)
  ].join('\n');
  
  return manifests;
}

console.log('🏗️  Horizontal Scaling Infrastructure initialized - Phase 3 Scaling ready');