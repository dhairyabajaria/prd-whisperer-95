import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/topbar";
import AIChatModal from "@/components/ai-chat-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bot, 
  MessageSquare, 
  Brain, 
  Zap, 
  TrendingUp, 
  BarChart3,
  DollarSign,
  Package,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Lightbulb,
  Activity,
  Target,
  RefreshCw,
  Download,
  Settings,
  HelpCircle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface AIInsight {
  type: 'reorder' | 'price_optimization' | 'expiry_alert' | 'sales_trend' | 'customer_insight';
  title: string;
  description: string;
  actionText: string;
  urgency: 'low' | 'medium' | 'high';
  data?: any;
}

interface HealthStatus {
  status: string;
  openaiConfigured: boolean;
  databaseConfigured: boolean;
  sessionConfigured: boolean;
}

export default function AIAssistant() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: "Hello! I'm your AI assistant for pharmaceutical distribution management. I can help you with sales analysis, inventory optimization, customer insights, and much more. What would you like to explore today?",
      role: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const { toast } = useToast();

  // Fetch health status to check AI configuration
  const { data: healthStatus } = useQuery<HealthStatus>({
    queryKey: ["/api/health"],
    staleTime: 30 * 1000, // 30 seconds
  });

  const isAiConfigured = healthStatus?.openaiConfigured ?? false;

  // Chat mutation
  const chatMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest("POST", "/api/ai/chat", { query });
      return await response.json();
    },
    onSuccess: (data) => {
      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        content: data.response || "I'm sorry, I couldn't process your request.",
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    },
    onError: (error) => {
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
      
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mock AI insights data
  const mockInsights: AIInsight[] = [
    {
      type: 'reorder',
      title: 'Inventory Reorder Recommendation',
      description: 'Based on sales patterns, consider reordering Amoxicillin 500mg (current stock: 45 units, 7-day supply remaining).',
      actionText: 'Create purchase order',
      urgency: 'high'
    },
    {
      type: 'price_optimization',
      title: 'Price Optimization Opportunity',
      description: 'Ibuprofen 400mg is priced 12% below market average. Consider gradual price adjustment to increase margins.',
      actionText: 'Review pricing strategy',
      urgency: 'medium'
    },
    {
      type: 'expiry_alert',
      title: 'Expiry Management Alert',
      description: '8 products are expiring within 30 days. Implement FEFO strategy to minimize waste.',
      actionText: 'View expiring products',
      urgency: 'high'
    },
    {
      type: 'sales_trend',
      title: 'Sales Trend Analysis',
      description: 'Antibiotics category showing 15% growth this month. Consider expanding product range.',
      actionText: 'View sales report',
      urgency: 'low'
    },
    {
      type: 'customer_insight',
      title: 'Customer Behavior Insight',
      description: 'PharmaCorp Ltd increased order frequency by 25%. They might be ready for volume discounts.',
      actionText: 'Review customer profile',
      urgency: 'medium'
    }
  ];

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    chatMutation.mutate(inputValue);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'border-2 border-[var(--priority-critical-bg)] bg-[var(--status-error-bg-light)]';
      case 'medium': return 'border-2 border-[var(--priority-medium-bg)] bg-[var(--status-warning-bg-light)]';
      default: return 'border border-[var(--ai-bg)] bg-[var(--ai-bg-light)]';
    }
  };

  const getUrgencyBadgeColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'badge-priority-critical';
      case 'medium': return 'badge-priority-medium';
      default: return 'badge-ai';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'reorder': return Package;
      case 'price_optimization': return DollarSign;
      case 'expiry_alert': return AlertTriangle;
      case 'sales_trend': return TrendingUp;
      case 'customer_insight': return Users;
      default: return Lightbulb;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar 
          title="AI Assistant"
          subtitle="Intelligent insights and automated recommendations for your pharmaceutical business"
          onOpenAIChat={() => setIsChatOpen(true)}
        />
        
        <main className="flex-1 overflow-y-auto p-6" data-testid="main-ai-assistant">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chat" data-testid="tab-chat">
                <MessageSquare className="w-4 h-4 mr-2" />
                AI Chat
              </TabsTrigger>
              <TabsTrigger value="insights" data-testid="tab-insights">
                <Brain className="w-4 h-4 mr-2" />
                Smart Insights
              </TabsTrigger>
              <TabsTrigger value="automation" data-testid="tab-automation">
                <Zap className="w-4 h-4 mr-2" />
                Automation
              </TabsTrigger>
            </TabsList>

            {/* AI Chat Tab */}
            <TabsContent value="chat" className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Chat Interface */}
                <div className="xl:col-span-2">
                  <Card className="h-[600px] flex flex-col" data-testid="card-chat-interface">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="flex items-center">
                        <Bot className="w-5 h-5 mr-2" />
                        AI Chat Assistant
                      </CardTitle>
                      <Badge variant={isAiConfigured ? "default" : "secondary"} data-testid="badge-ai-status">
                        {isAiConfigured ? "AI Enabled" : "Fallback Mode"}
                      </Badge>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto space-y-4 mb-4" data-testid="chat-messages">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] p-3 rounded-lg ${
                                message.role === 'user'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                              data-testid={`message-${message.role}-${message.id}`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {message.timestamp.toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))}
                        {chatMutation.isPending && (
                          <div className="flex justify-start">
                            <div className="bg-muted p-3 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                <span className="text-sm">AI is thinking...</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Input */}
                      <div className="flex items-center space-x-2">
                        <Input
                          placeholder={isAiConfigured ? "Ask me anything about your pharmaceutical business..." : "Ask me for guidance (basic mode)..."}
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          disabled={chatMutation.isPending}
                          data-testid="input-chat-message"
                        />
                        <Button 
                          onClick={handleSendMessage}
                          disabled={!inputValue.trim() || chatMutation.isPending}
                          data-testid="button-send-message"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <div className="space-y-4">
                  <Card data-testid="card-quick-actions">
                    <CardHeader>
                      <CardTitle className="text-lg">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button variant="outline" className="w-full justify-start" data-testid="action-sales-analysis">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Analyze Sales Performance
                      </Button>
                      <Button variant="outline" className="w-full justify-start" data-testid="action-inventory-check">
                        <Package className="w-4 h-4 mr-2" />
                        Check Inventory Levels
                      </Button>
                      <Button variant="outline" className="w-full justify-start" data-testid="action-customer-insights">
                        <Users className="w-4 h-4 mr-2" />
                        Customer Insights
                      </Button>
                      <Button variant="outline" className="w-full justify-start" data-testid="action-financial-summary">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Financial Summary
                      </Button>
                      <Button variant="outline" className="w-full justify-start" data-testid="action-expiry-alerts">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Expiry Alerts
                      </Button>
                    </CardContent>
                  </Card>

                  <Card data-testid="card-ai-capabilities">
                    <CardHeader>
                      <CardTitle className="text-lg">AI Capabilities</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">Sales Analysis</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">Inventory Optimization</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">Customer Insights</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">Financial Reporting</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">Predictive Analytics</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Smart Insights Tab */}
            <TabsContent value="insights" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {mockInsights.map((insight, index) => {
                  const IconComponent = getInsightIcon(insight.type);
                  return (
                    <Card key={index} className={`border-l-4 ${getUrgencyColor(insight.urgency)}`} data-testid={`insight-${insight.type}-${index}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <IconComponent className="w-5 h-5" />
                            <CardTitle className="text-lg">{insight.title}</CardTitle>
                          </div>
                          <Badge className={getUrgencyBadgeColor(insight.urgency)} data-testid={`badge-urgency-${insight.urgency}`}>
                            {insight.urgency}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">{insight.description}</p>
                        <Button size="sm" className="w-full" data-testid={`button-action-${index}`}>
                          {insight.actionText}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* Automation Tab */}
            <TabsContent value="automation" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card data-testid="card-automation-rules">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Settings className="w-5 h-5 mr-2" />
                      Automation Rules
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Low Stock Alerts</p>
                        <p className="text-sm text-muted-foreground">Auto-notify when stock &lt; 10 units</p>
                      </div>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Expiry Warnings</p>
                        <p className="text-sm text-muted-foreground">Alert 90 days before expiry</p>
                      </div>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Price Optimization</p>
                        <p className="text-sm text-muted-foreground">Weekly price analysis</p>
                      </div>
                      <Badge variant="outline">Inactive</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-automation-metrics">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Activity className="w-5 h-5 mr-2" />
                      Automation Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 border rounded-lg">
                        <p className="text-2xl font-bold text-primary">85%</p>
                        <p className="text-sm text-muted-foreground">Tasks Automated</p>
                      </div>
                      <div className="text-center p-3 border rounded-lg">
                        <p className="text-2xl font-bold text-green-600">2.5h</p>
                        <p className="text-sm text-muted-foreground">Time Saved Daily</p>
                      </div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">98.2%</p>
                      <p className="text-sm text-muted-foreground">Accuracy Rate</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <AIChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}