import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  Percent,
  Eye,
  ChevronRight,
  BarChart3,
  PieChart
} from "lucide-react";
import { PieChart as RechartsPie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { format } from "date-fns";
import { type User as UserType, type CommissionEntry, type Invoice } from "@shared/schema";

interface SalesRepCommissionSummary {
  totalAccrued: number;
  totalApproved: number;
  totalPaid: number;
  entries: (CommissionEntry & { invoice: Invoice })[];
}

interface SalesRepAnalyticsProps {
  salesRepId: string;
  salesRep?: UserType;
  startDate?: Date;
  endDate?: Date;
  onCommissionClick?: (commissionId: string) => void;
}

export default function SalesRepAnalytics({ 
  salesRepId, 
  salesRep, 
  startDate, 
  endDate, 
  onCommissionClick 
}: SalesRepAnalyticsProps) {
  const [viewMode, setViewMode] = useState<'overview' | 'chart'>('overview');

  // Fetch sales rep commission summary
  const { data: summary, isLoading, error } = useQuery<SalesRepCommissionSummary>({
    queryKey: [
      "/api/crm/commissions/summary", 
      salesRepId,
      { 
        startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
        endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined
      }
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", format(startDate, "yyyy-MM-dd"));
      if (endDate) params.append("endDate", format(endDate, "yyyy-MM-dd"));
      
      const response = await fetch(`/api/crm/commissions/summary/${salesRepId}?${params}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch commission summary");
      }
      return response.json();
    },
  });

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(2)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accrued': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'approved': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accrued': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'paid': return <DollarSign className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Calculate metrics
  const totalCommissions = summary ? summary.totalAccrued + summary.totalApproved + summary.totalPaid : 0;
  const averageCommissionPercent = summary && summary.entries.length > 0 
    ? summary.entries.reduce((acc, entry) => acc + parseFloat(entry.commissionPercent), 0) / summary.entries.length
    : 0;
  
  const recentEntries = summary?.entries.slice(0, 5) || [];

  // Prepare chart data
  const statusBreakdownData = summary ? [
    { name: 'Accrued', value: summary.totalAccrued, color: '#f97316' },
    { name: 'Approved', value: summary.totalApproved, color: '#3b82f6' },
    { name: 'Paid', value: summary.totalPaid, color: '#10b981' }
  ].filter(item => item.value > 0) : [];

  const monthlyTrends = summary ? summary.entries.reduce((acc, entry) => {
    const month = format(new Date(entry.createdAt || new Date()), "MMM yyyy");
    if (!acc[month]) {
      acc[month] = { month, accrued: 0, approved: 0, paid: 0 };
    }
    const amount = parseFloat(entry.commissionAmount || '0');
    switch (entry.status) {
      case 'accrued': acc[month].accrued += amount; break;
      case 'approved': acc[month].approved += amount; break;
      case 'paid': acc[month].paid += amount; break;
    }
    return acc;
  }, {} as Record<string, { month: string; accrued: number; approved: number; paid: number }>) : {};

  const trendsData = Object.values(monthlyTrends).slice(-6); // Last 6 months

  if (error) {
    return (
      <Card className="w-full" data-testid="salesrep-analytics-error">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Failed to load analytics</h3>
            <p className="text-muted-foreground text-sm">Please check your connection and try again</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full" data-testid="salesrep-analytics-panel">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <User className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="text-lg" data-testid="salesrep-name">
                {salesRep ? `${salesRep.firstName} ${salesRep.lastName}` : 'Sales Rep Analytics'}
              </CardTitle>
              <p className="text-sm text-muted-foreground" data-testid="salesrep-email">
                {salesRep?.email}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'overview' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('overview')}
              data-testid="button-overview-mode"
            >
              <BarChart3 className="w-4 h-4 mr-1" />
              Overview
            </Button>
            <Button
              variant={viewMode === 'chart' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('chart')}
              data-testid="button-chart-mode"
            >
              <PieChart className="w-4 h-4 mr-1" />
              Charts
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-24" />
                </div>
              ))}
            </div>
            <Separator />
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4" data-testid="kpis-section">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium text-muted-foreground">Accrued</span>
                </div>
                <div className="text-xl font-bold" data-testid="kpi-accrued">
                  {formatCurrency(summary?.totalAccrued || 0)}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-muted-foreground">Approved</span>
                </div>
                <div className="text-xl font-bold" data-testid="kpi-approved">
                  {formatCurrency(summary?.totalApproved || 0)}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-muted-foreground">Paid</span>
                </div>
                <div className="text-xl font-bold" data-testid="kpi-paid">
                  {formatCurrency(summary?.totalPaid || 0)}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Percent className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium text-muted-foreground">Avg Rate</span>
                </div>
                <div className="text-xl font-bold" data-testid="kpi-avg-rate">
                  {formatPercentage(averageCommissionPercent)}
                </div>
              </div>
            </div>

            <Separator />

            {/* Content based on view mode */}
            {viewMode === 'overview' ? (
              <div className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Total Commissions</span>
                    </div>
                    <div className="text-2xl font-bold" data-testid="total-commissions">
                      {formatCurrency(totalCommissions)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Commission Entries</span>
                    </div>
                    <div className="text-2xl font-bold" data-testid="total-entries">
                      {summary?.entries.length || 0}
                    </div>
                  </div>
                </div>

                {/* Recent Entries */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Recent Commission Entries</h4>
                    {recentEntries.length > 5 && (
                      <Button variant="ghost" size="sm" data-testid="button-view-all-entries">
                        View All
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    )}
                  </div>
                  
                  <ScrollArea className="h-80">
                    <div className="space-y-3" data-testid="recent-entries-list">
                      {recentEntries.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No commission entries found</p>
                        </div>
                      ) : (
                        recentEntries.map((entry) => (
                          <div
                            key={entry.id}
                            className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => onCommissionClick?.(entry.id)}
                            data-testid={`entry-item-${entry.id}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-sm">
                                    {entry.invoice?.invoiceNumber}
                                  </span>
                                  <Badge className={getStatusColor(entry.status || 'accrued')} variant="secondary">
                                    <span className="flex items-center space-x-1">
                                      {getStatusIcon(entry.status || 'accrued')}
                                      <span>{entry.status || 'accrued'}</span>
                                    </span>
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(entry.createdAt || new Date()), "MMM dd, yyyy")}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold">
                                  {formatCurrency(parseFloat(entry.commissionAmount || '0'), entry.currency || 'USD')}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatPercentage(parseFloat(entry.commissionPercent || '0'))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Status Breakdown Pie Chart */}
                {statusBreakdownData.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-4">Commission Status Breakdown</h4>
                    <div className="h-64" data-testid="status-breakdown-chart">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPie
                          data={statusBreakdownData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          dataKey="value"
                        >
                          {statusBreakdownData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                          <Tooltip formatter={(value) => formatCurrency(value as number)} />
                          <Legend />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Monthly Trends Bar Chart */}
                {trendsData.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-4">Monthly Commission Trends</h4>
                    <div className="h-64" data-testid="monthly-trends-chart">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trendsData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value) => formatCurrency(value as number)} />
                          <Legend />
                          <Bar dataKey="accrued" stackId="a" fill="#f97316" name="Accrued" />
                          <Bar dataKey="approved" stackId="a" fill="#3b82f6" name="Approved" />
                          <Bar dataKey="paid" stackId="a" fill="#10b981" name="Paid" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {statusBreakdownData.length === 0 && trendsData.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No data available for charts</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}