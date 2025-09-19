import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/topbar";
import AIChatModal from "@/components/ai-chat-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent, 
  ChartLegend, 
  ChartLegendContent,
  ChartDonut,
  ChartGauge,
  type ChartConfig,
  type ComparisonData,
  type DrillDownLevel
} from "@/components/ui/chart";
import { 
  Brain, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Users,
  MessageSquare,
  BarChart3,
  PieChart,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Star,
  ThumbsUp,
  ThumbsDown,
  Activity,
  Zap,
  Target,
  Clock,
  Award,
  AlertCircle
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Customer, type Communication, type SentimentAnalysis } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  BarChart as RechartsBarChart,
  Bar,
  Area,
  AreaChart
} from "recharts";
import * as React from "react";

// Types for sentiment data - matching backend API response
interface GlobalSentimentSummary {
  totalCommunications: number;
  averageScore: number;
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  topNegativeCustomers: Array<{
    customerId: string;
    customerName: string;
    averageScore: number;
  }>;
  topPositiveCustomers: Array<{
    customerId: string;
    customerName: string;
    averageScore: number;
  }>;
}

interface GlobalSentimentResponse {
  global: GlobalSentimentSummary;
  generatedAt: string;
  aiConfigured: boolean;
}

interface CustomerSentimentSummary {
  customerId: string;
  customerName: string;
  totalCommunications: number;
  averageSentiment: number;
  sentimentLabel: 'positive' | 'neutral' | 'negative';
  lastCommunicationDate: string;
  trend: {
    direction: 'up' | 'down' | 'stable';
    change: number;
  };
}

interface CommunicationWithSentiment extends Communication {
  sentimentScore?: number;
  sentimentLabel?: string;
  sentimentConfidence?: number;
  sentimentAspects?: string[];
}

interface SentimentTrendData {
  date: string;
  positive: number;
  neutral: number;
  negative: number;
  average: number;
}

interface AIInsight {
  type: 'reorder' | 'price_optimization' | 'expiry_alert' | 'sales_trend' | 'sentiment_alert';
  title: string;
  description: string;
  actionText: string;
  urgency: 'low' | 'medium' | 'high';
  data?: any;
}

export default function SentimentAnalytics() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTimeRange, setSelectedTimeRange] = useState("30d");
  const [selectedCommunicationType, setSelectedCommunicationType] = useState("all");
  const [selectedSentimentFilter, setSelectedSentimentFilter] = useState("all");
  const { toast } = useToast();

  // Fetch global sentiment summary
  const { data: globalSentiment, isLoading: globalLoading, error: globalError } = useQuery<GlobalSentimentResponse>({
    queryKey: ["/api/ai/sentiment/summary"],
  });

  // Fetch customers for sentiment analysis
  const { data: customers, isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  // Fetch customer sentiment summaries
  const { data: customerSentiments, isLoading: customerSentimentsLoading } = useQuery({
    queryKey: ["/api/ai/sentiment/customers/summaries"],
    queryFn: async () => {
      if (!customers?.length) return [];
      
      const sentimentPromises = customers.map(async (customer) => {
        try {
          const response = await fetch(`/api/ai/sentiment/customers/${customer.id}/summary`);
          if (response.ok) {
            const sentimentSummary = await response.json();
            return {
              customerId: customer.id,
              customerName: customer.name,
              ...sentimentSummary.summary
            };
          }
        } catch (error) {
          console.warn(`Failed to fetch sentiment for customer ${customer.id}:`, error);
        }
        return null;
      });
      
      const results = await Promise.all(sentimentPromises);
      return results.filter(Boolean) as CustomerSentimentSummary[];
    },
    enabled: !!customers?.length,
  });

  // Fetch recent communications with sentiment analysis
  const { data: recentCommunications, isLoading: communicationsLoading } = useQuery<CommunicationWithSentiment[]>({
    queryKey: ["/api/marketing/communications"],
  });

  // Batch analyze sentiment for new communications
  const batchAnalyzeMutation = useMutation({
    mutationFn: async (customerId: string) => {
      const response = await apiRequest("POST", `/api/ai/sentiment/customers/${customerId}/batch`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/sentiment/customers/summaries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai/sentiment/summary"] });
      toast({
        title: "Success",
        description: "Sentiment analysis completed successfully",
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      console.error('Sentiment analysis error:', error);
      let errorMessage = "Unable to analyze sentiment for this customer. Please try again.";
      
      if (error.message) {
        if (error.message.includes('no communications')) {
          errorMessage = "No communications found for this customer. Add customer communications first to enable sentiment analysis.";
        } else if (error.message.includes('AI service') || error.message.includes('OpenAI')) {
          errorMessage = "AI sentiment analysis service is temporarily unavailable. Please try again later or contact admin.";
        } else if (error.message.includes('quota') || error.message.includes('limit')) {
          errorMessage = "AI analysis quota exceeded. Please contact admin or try again later.";
        } else if (error.message.includes('customer')) {
          errorMessage = "Selected customer is invalid or no longer exists. Please refresh the page and try again.";
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = "Network error - please check your connection and try again.";
        } else if (error.message.includes('processing')) {
          errorMessage = "Error processing communications for analysis. Please ensure communications contain valid text content.";
        } else {
          errorMessage = `Sentiment analysis error: ${error.message}`;
        }
      }
      
      toast({
        title: "Sentiment Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const formatSentimentScore = (score: number) => {
    return (score * 100).toFixed(1) + '%';
  };

  const getSentimentColor = (score: number | string) => {
    const numScore = typeof score === 'string' ? parseFloat(score) : score;
    if (numScore > 0.1) return 'text-green-600';
    if (numScore < -0.1) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getSentimentBadgeColor = (label: string) => {
    switch (label) {
      case 'positive': return 'bg-green-100 text-green-800';
      case 'negative': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getSentimentIcon = (label: string) => {
    switch (label) {
      case 'positive': return ThumbsUp;
      case 'negative': return ThumbsDown;
      default: return Minus;
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up': return TrendingUp;
      case 'down': return TrendingDown;
      default: return Minus;
    }
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Mock data for demonstration with enhanced information
  const mockSentimentTrend: SentimentTrendData[] = [
    { date: '2024-01-01', positive: 65, neutral: 25, negative: 10, average: 0.55 },
    { date: '2024-01-08', positive: 70, neutral: 20, negative: 10, average: 0.60 },
    { date: '2024-01-15', positive: 68, neutral: 22, negative: 10, average: 0.58 },
    { date: '2024-01-22', positive: 72, neutral: 18, negative: 10, average: 0.62 },
    { date: '2024-01-29', positive: 75, neutral: 15, negative: 10, average: 0.65 },
  ];

  // Calculate derived metrics - MOVED UP to be available for other calculations
  const totalCommunications = globalSentiment?.global?.totalCommunications || 0;
  const averageSentiment = globalSentiment?.global?.averageScore || 0;

  // Chart configurations - MOVED UP to be available for drill-down state
  const pieChartData = globalSentiment ? [
    { name: 'Positive', value: globalSentiment.global.sentimentDistribution.positive || 0, color: '#10b981' },
    { name: 'Neutral', value: globalSentiment.global.sentimentDistribution.neutral || 0, color: '#f59e0b' },
    { name: 'Negative', value: globalSentiment.global.sentimentDistribution.negative || 0, color: '#ef4444' },
  ] : [];

  // Enhanced chart data with drill-down capabilities
  const [drillDownState, setDrillDownState] = React.useState<{
    levels: DrillDownLevel[]
    currentLevel: number
  }>({ 
    levels: [{
      id: 'root',
      label: 'All Communications', 
      data: pieChartData
    }],
    currentLevel: 0 
  });

  // Comparison data for YoY/MoM functionality
  const comparisonData: ComparisonData = {
    current: averageSentiment,
    previous: averageSentiment - 0.05, // Mock previous period data
    change: 0.05,
    changePercentage: 8.3,
    trend: 'up' as const
  };

  // Enhanced pie chart data with totals for percentage calculations
  const enhancedPieChartData = pieChartData.map(item => ({
    ...item,
    total: totalCommunications
  }));

  // Area chart data for sentiment distribution over time
  const areaChartData = [
    { date: '2024-01', positive: 65, neutral: 25, negative: 10 },
    { date: '2024-02', positive: 68, neutral: 22, negative: 10 },
    { date: '2024-03', positive: 70, neutral: 20, negative: 10 },
    { date: '2024-04', positive: 72, neutral: 18, negative: 10 },
    { date: '2024-05', positive: 75, neutral: 15, negative: 10 },
  ];

  // Gauge data for customer satisfaction score
  const customerSatisfactionScore = Math.round(averageSentiment * 100) + 50; // Convert to 0-100 scale

  // Drill-down handlers
  const handleDrillDown = (data: any, level: DrillDownLevel) => {
    // Mock drill-down data - in real scenario this would fetch detailed data
    const detailData = [
      { name: 'Q1 2024', value: 125, color: '#10b981' },
      { name: 'Q2 2024', value: 98, color: '#f59e0b' },
      { name: 'Q3 2024', value: 67, color: '#ef4444' },
      { name: 'Q4 2024', value: 45, color: '#8b5cf6' },
    ];

    setDrillDownState(prev => ({
      levels: [...prev.levels, {
        id: data.name,
        label: `${data.name} Details`,
        data: detailData,
        parentId: level.id
      }],
      currentLevel: prev.currentLevel + 1
    }));
  };

  const handleDrillUp = () => {
    setDrillDownState(prev => {
      if (prev.currentLevel > 0) {
        return {
          levels: prev.levels.slice(0, -1),
          currentLevel: prev.currentLevel - 1
        };
      }
      return prev;
    });
  };

  // Format currency for tooltips
  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const mockAIInsights: AIInsight[] = [
    {
      type: 'sentiment_alert',
      title: 'Customer Sentiment Drop Alert',
      description: 'PharmaCorp Ltd has shown a 15% decrease in sentiment over the last week. Recent communications indicate concerns about delivery delays.',
      actionText: 'Review customer communications',
      urgency: 'high'
    },
    {
      type: 'sentiment_alert', 
      title: 'Positive Sentiment Opportunity',
      description: 'MedSupply Inc has consistently positive sentiment (85% positive). Consider them for upselling opportunities.',
      actionText: 'Create upselling campaign',
      urgency: 'medium'
    },
    {
      type: 'sentiment_alert',
      title: 'Communication Training Needed',
      description: 'Phone communications show 20% lower sentiment than email. Training on phone communication skills recommended.',
      actionText: 'Schedule training session',
      urgency: 'medium'
    }
  ];

  // Chart configurations - MOVED TO EARLIER SECTION

  const chartConfig = {
    positive: {
      label: "Positive",
      color: "hsl(var(--chart-1))",
    },
    neutral: {
      label: "Neutral", 
      color: "hsl(var(--chart-2))",
    },
    negative: {
      label: "Negative",
      color: "hsl(var(--chart-3))",
    },
    average: {
      label: "Average",
      color: "hsl(var(--chart-4))",
    },
  };

  // Filter data
  const filteredCustomerSentiments = customerSentiments?.filter(customer => {
    const matchesSearch = customer.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSentiment = selectedSentimentFilter === "all" || customer.sentimentLabel === selectedSentimentFilter;
    return matchesSearch && matchesSentiment;
  }) || [];

  const filteredCommunications = recentCommunications?.filter(comm => {
    const matchesSearch = comm.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comm.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedCommunicationType === "all" || comm.communicationType === selectedCommunicationType;
    return matchesSearch && matchesType;
  }) || [];

  // Calculate derived metrics - MOVED TO EARLIER SECTION
  
  // Calculate trend based on sentiment score (mock trend since backend doesn't provide it)
  const sentimentTrend = useMemo(() => {
    if (!averageSentiment) return { direction: 'stable' as const, percentage: 0 };
    
    // Mock trend calculation - in real scenario this would compare with historical data
    if (averageSentiment > 0.1) return { direction: 'up' as const, percentage: 5.2 };
    if (averageSentiment < -0.1) return { direction: 'down' as const, percentage: 3.1 };
    return { direction: 'stable' as const, percentage: 0 };
  }, [averageSentiment]);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar 
          title="Sentiment Analytics"
          subtitle="AI-powered customer sentiment insights and analysis"
          onOpenAIChat={() => setIsChatOpen(true)}
        />
        
        <main className="flex-1 overflow-y-auto p-6" data-testid="main-sentiment-analytics">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" data-testid="tab-overview">
                <BarChart3 className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="customers" data-testid="tab-customers">
                <Users className="w-4 h-4 mr-2" />
                Customer Insights
              </TabsTrigger>
              <TabsTrigger value="communications" data-testid="tab-communications">
                <MessageSquare className="w-4 h-4 mr-2" />
                Communications
              </TabsTrigger>
              <TabsTrigger value="insights" data-testid="tab-insights">
                <Brain className="w-4 h-4 mr-2" />
                AI Insights
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card data-testid="card-total-communications">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Communications</p>
                        <p className="text-2xl font-bold" data-testid="metric-total-communications">
                          {globalLoading ? <Skeleton className="h-8 w-16" /> : totalCommunications.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Analyzed this month</p>
                      </div>
                      <MessageSquare className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card data-testid="card-average-sentiment">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Average Sentiment</p>
                        <p className={`text-2xl font-bold ${getSentimentColor(averageSentiment)}`} data-testid="metric-average-sentiment">
                          {globalLoading ? <Skeleton className="h-8 w-16" /> : formatSentimentScore(averageSentiment)}
                        </p>
                        <div className="flex items-center mt-1">
                          {!globalLoading && (
                            <>
                              {sentimentTrend.direction === 'up' ? (
                                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                              ) : sentimentTrend.direction === 'down' ? (
                                <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                              ) : (
                                <Minus className="h-3 w-3 text-gray-600 mr-1" />
                              )}
                              <span className={`text-xs ${getTrendColor(sentimentTrend.direction)}`}>
                                {sentimentTrend.percentage}% vs last month
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <Brain className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card data-testid="card-positive-sentiment">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Positive Sentiment</p>
                        <p className="text-2xl font-bold text-green-600" data-testid="metric-positive-sentiment">
                          {globalLoading ? <Skeleton className="h-8 w-16" /> : (
                            totalCommunications > 0 
                              ? `${Math.round(((globalSentiment?.global?.sentimentDistribution?.positive || 0) / totalCommunications) * 100)}%`
                              : '0%'
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Customer satisfaction</p>
                      </div>
                      <ThumbsUp className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card data-testid="card-negative-sentiment">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Negative Sentiment</p>
                        <p className="text-2xl font-bold text-red-600" data-testid="metric-negative-sentiment">
                          {globalLoading ? <Skeleton className="h-8 w-16" /> : (
                            totalCommunications > 0 
                              ? `${Math.round(((globalSentiment?.global?.sentimentDistribution?.negative || 0) / totalCommunications) * 100)}%`
                              : '0%'
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Needs attention</p>
                      </div>
                      <ThumbsDown className="h-8 w-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Enhanced Charts Section */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Enhanced Sentiment Distribution with Drill-down */}
                <Card data-testid="card-sentiment-distribution">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <PieChart className="w-5 h-5 mr-2" />
                      Sentiment Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {globalLoading ? (
                      <Skeleton className="h-64 w-full" />
                    ) : (
                      <ChartContainer 
                        config={chartConfig} 
                        exportOptions={{
                          enableExport: true,
                          filename: 'sentiment-distribution',
                          formats: ['png', 'pdf', 'csv']
                        }}
                        drillDown={{
                          levels: drillDownState.levels,
                          currentLevel: drillDownState.currentLevel,
                          onDrillDown: handleDrillDown,
                          onDrillUp: handleDrillUp
                        }}
                        comparison={comparisonData}
                        comparisonPeriod="mom"
                        responsiveConfig={{
                          sm: { height: 200, fontSize: '10px' },
                          md: { height: 250, fontSize: '12px' },
                          lg: { height: 300, fontSize: '14px' }
                        }}
                      >
                        <RechartsPieChart>
                          <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent 
                              hideLabel
                              showPercentage 
                              showTrend
                              percentageFormatter={formatPercentage}
                            />}
                          />
                          <RechartsPieChart 
                            data={drillDownState.levels[drillDownState.currentLevel]?.data || enhancedPieChartData}
                            onClick={(data, index) => {
                              if (data && drillDownState.currentLevel === 0) {
                                handleDrillDown(data, drillDownState.levels[drillDownState.currentLevel]);
                              }
                            }}
                          >
                            {(drillDownState.levels[drillDownState.currentLevel]?.data || enhancedPieChartData).map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.color} 
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                              />
                            ))}
                          </RechartsPieChart>
                          <ChartLegend content={<ChartLegendContent />} />
                        </RechartsPieChart>
                      </ChartContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Customer Satisfaction Gauge */}
                <Card data-testid="card-satisfaction-gauge">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Target className="w-5 h-5 mr-2" />
                      Customer Satisfaction
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {globalLoading ? (
                      <Skeleton className="h-64 w-full" />
                    ) : (
                      <ChartContainer 
                        config={chartConfig}
                        exportOptions={{
                          enableExport: true,
                          filename: 'satisfaction-gauge',
                          formats: ['png', 'pdf']
                        }}
                      >
                        <ChartGauge 
                          value={customerSatisfactionScore}
                          max={100}
                          min={0}
                          label="Satisfaction Score"
                          color="var(--chart-1)"
                        />
                      </ChartContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Sentiment Donut Chart */}
                <Card data-testid="card-sentiment-donut">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Activity className="w-5 h-5 mr-2" />
                      Sentiment Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {globalLoading ? (
                      <Skeleton className="h-64 w-full" />
                    ) : (
                      <ChartContainer 
                        config={chartConfig}
                        exportOptions={{
                          enableExport: true,
                          filename: 'sentiment-donut',
                          formats: ['png', 'pdf', 'csv']
                        }}
                      >
                        <ChartDonut 
                          data={enhancedPieChartData}
                          config={chartConfig}
                          innerRadius={50}
                          outerRadius={80}
                          centerContent={
                            <div className="text-center">
                              <div className="text-2xl font-bold text-foreground">
                                {formatSentimentScore(averageSentiment)}
                              </div>
                              <div className="text-sm text-muted-foreground">Avg Score</div>
                            </div>
                          }
                        />
                      </ChartContainer>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Area Chart and Line Chart Section */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                {/* Enhanced Area Chart for Sentiment Distribution */}
                <Card data-testid="card-sentiment-area">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2" />
                      Sentiment Distribution Over Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {globalLoading ? (
                      <Skeleton className="h-64 w-full" />
                    ) : (
                      <ChartContainer 
                        config={chartConfig} 
                        exportOptions={{
                          enableExport: true,
                          filename: 'sentiment-area-chart',
                          formats: ['png', 'pdf', 'csv']
                        }}
                        comparison={comparisonData}
                        comparisonPeriod="yoy"
                      >
                        <AreaChart data={areaChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <ChartTooltip 
                            content={<ChartTooltipContent 
                              showPercentage
                              showComparison
                              currencyFormatter={formatCurrency}
                            />} 
                          />
                          <ChartLegend content={<ChartLegendContent />} />
                          <Area 
                            type="monotone" 
                            dataKey="positive" 
                            stackId="1"
                            stroke="var(--chart-1)" 
                            fill="var(--chart-1)"
                            name="Positive"
                          />
                          <Area 
                            type="monotone" 
                            dataKey="neutral" 
                            stackId="1"
                            stroke="var(--chart-2)" 
                            fill="var(--chart-2)"
                            name="Neutral"
                          />
                          <Area 
                            type="monotone" 
                            dataKey="negative" 
                            stackId="1"
                            stroke="var(--chart-3)" 
                            fill="var(--chart-3)"
                            name="Negative"
                          />
                        </AreaChart>
                      </ChartContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Enhanced Sentiment Trend Line Chart */}
                <Card data-testid="card-sentiment-trend">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Activity className="w-5 h-5 mr-2" />
                      Average Sentiment Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {globalLoading ? (
                      <Skeleton className="h-64 w-full" />
                    ) : (
                      <ChartContainer 
                        config={chartConfig} 
                        exportOptions={{
                          enableExport: true,
                          filename: 'sentiment-trend',
                          formats: ['png', 'pdf', 'csv']
                        }}
                        comparison={comparisonData}
                        comparisonPeriod="mom"
                        responsiveConfig={{
                          sm: { height: 200, margin: { left: 10, right: 10 } },
                          md: { height: 250, margin: { left: 20, right: 20 } },
                          lg: { height: 300, margin: { left: 30, right: 30 } }
                        }}
                      >
                        <LineChart data={mockSentimentTrend}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          />
                          <YAxis 
                            tick={{ fontSize: 12 }}
                            domain={[0, 1]}
                            tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                          />
                          <ChartTooltip 
                            content={<ChartTooltipContent 
                              showTrend
                              showComparison
                              currencyFormatter={(value) => `${(value * 100).toFixed(1)}%`}
                            />} 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="average" 
                            stroke="var(--chart-4)" 
                            strokeWidth={3}
                            name="Average Sentiment"
                            dot={{ fill: 'var(--chart-4)', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: 'var(--chart-4)', strokeWidth: 2 }}
                          />
                        </LineChart>
                      </ChartContainer>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Enhanced Communication Type Breakdown */}
              <Card data-testid="card-communication-breakdown">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Sentiment by Communication Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {globalLoading ? (
                    <Skeleton className="h-64 w-full" />
                  ) : (
                    <ChartContainer 
                      config={chartConfig} 
                      exportOptions={{
                        enableExport: true,
                        filename: 'communication-breakdown',
                        formats: ['png', 'pdf', 'csv']
                      }}
                      comparison={comparisonData}
                      comparisonPeriod="mom"
                      responsiveConfig={{
                        sm: { height: 250, fontSize: '10px' },
                        md: { height: 300, fontSize: '12px' },
                        lg: { height: 350, fontSize: '14px' }
                      }}
                    >
                      <RechartsBarChart data={[
                        { type: 'Email', positive: 68, neutral: 22, negative: 10, total: 100, trend: { direction: 'up', changePercentage: 5.2 } },
                        { type: 'Phone', positive: 55, neutral: 30, negative: 15, total: 100, trend: { direction: 'down', changePercentage: -2.1 } },
                        { type: 'Meeting', positive: 75, neutral: 20, negative: 5, total: 100, trend: { direction: 'up', changePercentage: 8.7 } },
                        { type: 'SMS', positive: 60, neutral: 25, negative: 15, total: 100, trend: { direction: 'stable', changePercentage: 0.3 } },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <ChartTooltip 
                          content={<ChartTooltipContent 
                            showPercentage
                            showTrend
                            showComparison
                            percentageFormatter={formatPercentage}
                          />} 
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar 
                          dataKey="positive" 
                          fill="var(--chart-1)" 
                          name="Positive"
                          radius={[0, 0, 4, 4]}
                        />
                        <Bar 
                          dataKey="neutral" 
                          fill="var(--chart-2)" 
                          name="Neutral"
                          radius={[0, 0, 4, 4]}
                        />
                        <Bar 
                          dataKey="negative" 
                          fill="var(--chart-3)" 
                          name="Negative"
                          radius={[4, 4, 0, 0]}
                        />
                      </RechartsBarChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Customer Insights Tab */}
            <TabsContent value="customers" className="space-y-6">
              {/* Filters */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search customers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-80"
                      data-testid="input-search-customers"
                    />
                  </div>
                  
                  <Select value={selectedSentimentFilter} onValueChange={setSelectedSentimentFilter}>
                    <SelectTrigger className="w-40" data-testid="select-sentiment-filter">
                      <SelectValue placeholder="All Sentiment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sentiment</SelectItem>
                      <SelectItem value="positive">Positive</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="negative">Negative</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button 
                    variant="outline" 
                    onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/ai/sentiment/customers/summaries"] })}
                    data-testid="button-refresh-sentiment"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>

                <Button 
                  variant="outline"
                  data-testid="button-export-sentiment"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>

              {/* Top/Bottom Customers Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card data-testid="card-top-customers">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Award className="w-5 h-5 mr-2 text-green-600" />
                      Top Positive Customers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {customerSentimentsLoading ? (
                        Array.from({ length: 3 }).map((_, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-6 w-16 rounded-full" />
                          </div>
                        ))
                      ) : (
                        filteredCustomerSentiments
                          .filter(c => c.sentimentLabel === 'positive')
                          .sort((a, b) => b.averageSentiment - a.averageSentiment)
                          .slice(0, 5)
                          .map((customer) => (
                            <div key={customer.customerId} className="flex items-center justify-between">
                              <Link 
                                href={`/customers/${customer.customerId}`}
                                className="font-medium text-foreground hover:text-primary"
                                data-testid={`link-customer-${customer.customerId}`}
                              >
                                {customer.customerName}
                              </Link>
                              <Badge className="badge-success-light" data-testid={`badge-sentiment-${customer.customerId}`}>
                                {formatSentimentScore(customer.averageSentiment)}
                              </Badge>
                            </div>
                          ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-attention-customers">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                      Customers Needing Attention
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {customerSentimentsLoading ? (
                        Array.from({ length: 3 }).map((_, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-6 w-16 rounded-full" />
                          </div>
                        ))
                      ) : (
                        filteredCustomerSentiments
                          .filter(c => c.sentimentLabel === 'negative')
                          .sort((a, b) => a.averageSentiment - b.averageSentiment)
                          .slice(0, 5)
                          .map((customer) => (
                            <div key={customer.customerId} className="flex items-center justify-between">
                              <Link 
                                href={`/customers/${customer.customerId}`}
                                className="font-medium text-foreground hover:text-primary"
                                data-testid={`link-customer-${customer.customerId}`}
                              >
                                {customer.customerName}
                              </Link>
                              <Badge className="badge-error-light" data-testid={`badge-sentiment-${customer.customerId}`}>
                                {formatSentimentScore(customer.averageSentiment)}
                              </Badge>
                            </div>
                          ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Customer Sentiment Table */}
              <Card data-testid="card-customer-sentiment-table">
                <CardHeader>
                  <CardTitle>Customer Sentiment Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Communications</TableHead>
                        <TableHead>Sentiment Score</TableHead>
                        <TableHead>Sentiment Label</TableHead>
                        <TableHead>Trend</TableHead>
                        <TableHead>Last Communication</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customerSentimentsLoading ? (
                        Array.from({ length: 5 }).map((_, index) => (
                          <TableRow key={index}>
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                          </TableRow>
                        ))
                      ) : filteredCustomerSentiments.length > 0 ? (
                        filteredCustomerSentiments.map((customer) => {
                          const SentimentIcon = getSentimentIcon(customer.sentimentLabel);
                          const TrendIcon = getTrendIcon(customer.trend?.direction || 'stable');
                          
                          return (
                            <TableRow key={customer.customerId} data-testid={`row-customer-${customer.customerId}`}>
                              <TableCell>
                                <Link 
                                  href={`/customers/${customer.customerId}`}
                                  className="font-medium text-foreground hover:text-primary"
                                  data-testid={`link-customer-${customer.customerId}`}
                                >
                                  {customer.customerName}
                                </Link>
                              </TableCell>
                              <TableCell data-testid={`text-communications-${customer.customerId}`}>
                                {customer.totalCommunications || 0}
                              </TableCell>
                              <TableCell>
                                <span className={getSentimentColor(customer.averageSentiment)} data-testid={`text-score-${customer.customerId}`}>
                                  {formatSentimentScore(customer.averageSentiment)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge className={getSentimentBadgeColor(customer.sentimentLabel)} data-testid={`badge-label-${customer.customerId}`}>
                                  <SentimentIcon className="w-3 h-3 mr-1" />
                                  {customer.sentimentLabel}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <TrendIcon className={`w-4 h-4 ${getTrendColor(customer.trend?.direction || 'stable')}`} />
                                  <span className={`ml-1 text-sm ${getTrendColor(customer.trend?.direction || 'stable')}`}>
                                    {customer.trend?.change ? `${customer.trend.change > 0 ? '+' : ''}${customer.trend.change}%` : '-'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell data-testid={`text-last-comm-${customer.customerId}`}>
                                {customer.lastCommunicationDate ? 
                                  new Date(customer.lastCommunicationDate).toLocaleDateString() : 
                                  'No communications'
                                }
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => batchAnalyzeMutation.mutate(customer.customerId)}
                                    disabled={batchAnalyzeMutation.isPending}
                                    data-testid={`button-analyze-${customer.customerId}`}
                                  >
                                    <Brain className="w-3 h-3 mr-1" />
                                    Analyze
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    asChild
                                    data-testid={`button-view-${customer.customerId}`}
                                  >
                                    <Link href={`/customers/${customer.customerId}`}>
                                      <Eye className="w-3 h-3" />
                                    </Link>
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <div className="flex flex-col items-center justify-center">
                              <Users className="w-12 h-12 text-muted-foreground/40 mb-2" />
                              <p className="text-muted-foreground">No customer sentiment data found</p>
                              <p className="text-sm text-muted-foreground/70">
                                {searchTerm || selectedSentimentFilter !== 'all' ? 'Try adjusting your filters' : 'Customer sentiment data will appear here as communications are analyzed'}
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Communications Tab */}
            <TabsContent value="communications" className="space-y-6">
              {/* Filters */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search communications..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-80"
                      data-testid="input-search-communications"
                    />
                  </div>
                  
                  <Select value={selectedCommunicationType} onValueChange={setSelectedCommunicationType}>
                    <SelectTrigger className="w-40" data-testid="select-communication-type">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                    <SelectTrigger className="w-40" data-testid="select-time-range">
                      <SelectValue placeholder="Time Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                      <SelectItem value="90d">Last 90 days</SelectItem>
                      <SelectItem value="1y">Last year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Communications Table */}
              <Card data-testid="card-communications-table">
                <CardHeader>
                  <CardTitle>Recent Communications with Sentiment Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Sentiment</TableHead>
                        <TableHead>Confidence</TableHead>
                        <TableHead>Key Aspects</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {communicationsLoading ? (
                        Array.from({ length: 5 }).map((_, index) => (
                          <TableRow key={index}>
                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                          </TableRow>
                        ))
                      ) : filteredCommunications.length > 0 ? (
                        filteredCommunications.slice(0, 20).map((communication) => (
                          <TableRow key={communication.id} data-testid={`row-communication-${communication.id}`}>
                            <TableCell data-testid={`text-date-${communication.id}`}>
                              {communication.createdAt ? new Date(communication.createdAt).toLocaleDateString() : '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" data-testid={`badge-type-${communication.id}`}>
                                {communication.communicationType}
                              </Badge>
                            </TableCell>
                            <TableCell data-testid={`text-customer-${communication.id}`}>
                              {/* This would need to be populated with customer name from API */}
                              Customer Name
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs">
                                <p className="truncate" data-testid={`text-subject-${communication.id}`}>
                                  {communication.subject || 'No subject'}
                                </p>
                                <p className="text-sm text-muted-foreground truncate">
                                  {communication.content?.substring(0, 50)}...
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {communication.sentimentLabel ? (
                                <Badge className={getSentimentBadgeColor(communication.sentimentLabel)} data-testid={`badge-sentiment-${communication.id}`}>
                                  {communication.sentimentLabel}
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Not analyzed</Badge>
                              )}
                            </TableCell>
                            <TableCell data-testid={`text-confidence-${communication.id}`}>
                              {communication.sentimentConfidence ? 
                                `${(communication.sentimentConfidence * 100).toFixed(0)}%` : 
                                '-'
                              }
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs">
                                {communication.sentimentAspects?.length ? (
                                  <div className="flex flex-wrap gap-1">
                                    {communication.sentimentAspects.slice(0, 2).map((aspect, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {aspect}
                                      </Badge>
                                    ))}
                                    {communication.sentimentAspects.length > 2 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{communication.sentimentAspects.length - 2}
                                      </Badge>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="outline" 
                                size="sm"
                                data-testid={`button-analyze-communication-${communication.id}`}
                              >
                                <Brain className="w-3 h-3 mr-1" />
                                Analyze
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            <div className="flex flex-col items-center justify-center">
                              <MessageSquare className="w-12 h-12 text-muted-foreground/40 mb-2" />
                              <p className="text-muted-foreground">No communications found</p>
                              <p className="text-sm text-muted-foreground/70">
                                {searchTerm || selectedCommunicationType !== 'all' ? 'Try adjusting your filters' : 'Communications will appear here as they are created and analyzed'}
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Insights Tab */}
            <TabsContent value="insights" className="space-y-6">
              {/* AI Insights Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {mockAIInsights.map((insight, index) => {
                  const urgencyColor = insight.urgency === 'high' ? 'border-red-200 bg-red-50' : 
                                     insight.urgency === 'medium' ? 'border-yellow-200 bg-yellow-50' : 
                                     'border-blue-200 bg-blue-50';
                  const urgencyTextColor = insight.urgency === 'high' ? 'text-red-800' : 
                                          insight.urgency === 'medium' ? 'text-yellow-800' : 
                                          'text-blue-800';
                  const urgencyIcon = insight.urgency === 'high' ? AlertTriangle : 
                                     insight.urgency === 'medium' ? AlertCircle : 
                                     CheckCircle;
                  const UrgencyIcon = urgencyIcon;

                  return (
                    <Card key={index} className={urgencyColor} data-testid={`card-insight-${index}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">{insight.title}</CardTitle>
                          <Badge className={`${urgencyTextColor} bg-transparent`}>
                            <UrgencyIcon className="w-3 h-3 mr-1" />
                            {insight.urgency}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground mb-4">{insight.description}</p>
                        <Button 
                          className={insight.urgency === 'high' ? 'bg-red-600 hover:bg-red-700' : ''}
                          data-testid={`button-action-${index}`}
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          {insight.actionText}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Recommendations Section */}
              <Card data-testid="card-recommendations">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    Sentiment Improvement Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-medium text-foreground">Proactive Customer Outreach</h4>
                      <p className="text-muted-foreground text-sm">
                        Reach out to customers with declining sentiment scores before issues escalate. Early intervention can prevent customer churn.
                      </p>
                    </div>
                    
                    <div className="border-l-4 border-green-500 pl-4">
                      <h4 className="font-medium text-foreground">Communication Training</h4>
                      <p className="text-muted-foreground text-sm">
                        Provide additional training for team members handling phone communications, as these show lower sentiment scores compared to email.
                      </p>
                    </div>
                    
                    <div className="border-l-4 border-purple-500 pl-4">
                      <h4 className="font-medium text-foreground">Response Time Optimization</h4>
                      <p className="text-muted-foreground text-sm">
                        Customers with faster response times show 23% higher positive sentiment. Consider implementing automated acknowledgment systems.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sentiment Monitoring Alerts */}
              <Card data-testid="card-monitoring-alerts">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Real-time Sentiment Monitoring
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                        <div>
                          <p className="font-medium">Overall System Health</p>
                          <p className="text-sm text-muted-foreground">All sentiment metrics within normal ranges</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                        <div>
                          <p className="font-medium">Response Time Alert</p>
                          <p className="text-sm text-muted-foreground">Average response time increased by 12% this week</p>
                        </div>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                        <div>
                          <p className="font-medium">AI Model Performance</p>
                          <p className="text-sm text-muted-foreground">Sentiment analysis confidence: 89.2%</p>
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">Optimal</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <AIChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}