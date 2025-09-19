import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Bot, Lightbulb, TrendingUp, AlertCircle, Settings } from "lucide-react";

interface AIRecommendation {
  productId: string;
  productName: string;
  currentStock: number;
  recommendedReorder: number;
  reason: string;
  urgency: 'low' | 'medium' | 'high';
  suggestedSupplier?: string;
}

interface AIInsight {
  type: 'reorder' | 'price_optimization' | 'expiry_alert' | 'sales_trend';
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

export default function AIRecommendations() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const { data: healthStatus } = useQuery<HealthStatus>({
    queryKey: ["/api/health"],
    staleTime: 30 * 1000, // 30 seconds
  });

  const { data: recommendations, isLoading: loadingRecs } = useQuery<AIRecommendation[]>({
    queryKey: ["/api/ai/recommendations"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: insights, isLoading: loadingInsights } = useQuery<AIInsight[]>({
    queryKey: ["/api/ai/insights"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'border-2 border-red-200 bg-red-50';
      case 'medium': return 'border-2 border-orange-200 bg-orange-50';
      default: return 'border border-blue-200 bg-blue-50';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'high': return AlertCircle;
      case 'medium': return TrendingUp;
      default: return Lightbulb;
    }
  };

  const handleApplyRecommendation = (recommendation: AIRecommendation) => {
    // Implementation would create a purchase order
    console.log('Applying recommendation:', recommendation);
  };

  const handleApplyInsight = (insight: AIInsight) => {
    // Implementation would navigate to relevant page or open modal
    console.log('Applying insight:', insight);
  };

  const isAiConfigured = healthStatus?.openaiConfigured ?? false;
  const showFallbackMessage = !isAiConfigured;

  return (
    <Card data-testid="card-ai-recommendations">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground flex items-center">
            <Bot className="text-primary mr-2 ai-pulse w-5 h-5" />
            AI Recommendations
            {showFallbackMessage && (
              <Badge variant="secondary" className="ml-2 badge-warning-light">
                Fallback Mode
              </Badge>
            )}
          </h3>
          {showFallbackMessage && isAdmin && (
            <Button
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/settings'}
              className="text-xs"
              data-testid="button-configure-ai"
            >
              <Settings className="w-3 h-3 mr-1" />
              Configure AI
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {showFallbackMessage && (
          <Alert className="border-yellow-200 badge-warning-light">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-[var(--status-warning-fg-light)]">
              AI features are using fallback data. 
              {isAdmin ? (
                <span> Configure OpenAI API key in <a href="/settings" className="font-medium underline">Settings</a> for enhanced recommendations.</span>
              ) : (
                <span> Contact your administrator to enable full AI features.</span>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {loadingRecs || loadingInsights ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Skeleton className="w-5 h-5 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-full mb-2" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Show insights first */}
            {insights && insights.length > 0 && (
              <>
                {insights.slice(0, 2).map((insight, index) => {
                  const IconComponent = getUrgencyIcon(insight.urgency);
                  
                  return (
                    <div 
                      key={index}
                      className={`border rounded-lg p-4 ${getUrgencyColor(insight.urgency)}`}
                      data-testid={`insight-${index}`}
                    >
                      <div className="flex items-start space-x-3">
                        <IconComponent className="w-5 h-5 text-primary mt-1" />
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground" data-testid={`insight-title-${index}`}>
                            {insight.title}
                          </h4>
                          <p className="text-muted-foreground text-sm mt-1" data-testid={`insight-description-${index}`}>
                            {insight.description}
                          </p>
                          <Button
                            variant="link"
                            className="text-primary text-sm mt-2 p-0 hover:underline"
                            onClick={() => handleApplyInsight(insight)}
                            data-testid={`button-apply-insight-${index}`}
                          >
                            {insight.actionText}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
            
            {/* Show inventory recommendations */}
            {recommendations && recommendations.length > 0 && (
              <>
                {recommendations.slice(0, 2).map((rec, index) => (
                  <div 
                    key={rec.productId}
                    className={`border rounded-lg p-4 ${getUrgencyColor(rec.urgency)}`}
                    data-testid={`recommendation-${index}`}
                  >
                    <div className="flex items-start space-x-3">
                      <Lightbulb className="w-5 h-5 text-primary mt-1" />
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground" data-testid={`rec-title-${index}`}>
                          Reorder: {rec.productName}
                        </h4>
                        <p className="text-muted-foreground text-sm mt-1" data-testid={`rec-description-${index}`}>
                          Current: {rec.currentStock} units. Recommended: {rec.recommendedReorder} units.
                        </p>
                        <p className="text-muted-foreground text-sm" data-testid={`rec-reason-${index}`}>
                          {rec.reason}
                        </p>
                        <Button
                          variant="link"
                          className="text-primary text-sm mt-2 p-0 hover:underline"
                          onClick={() => handleApplyRecommendation(rec)}
                          data-testid={`button-apply-rec-${index}`}
                        >
                          Create Purchase Order
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
            
            {/* Empty state */}
            {(!insights || insights.length === 0) && (!recommendations || recommendations.length === 0) && (
              <div className="text-center py-8">
                <Bot className="w-12 h-12 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-muted-foreground">No AI recommendations available</p>
                <p className="text-sm text-muted-foreground/70">AI is analyzing your data to provide insights</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
