import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/topbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Settings as SettingsIcon, 
  Bot, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2 
} from "lucide-react";

interface HealthStatus {
  status: string;
  openaiConfigured: boolean;
  databaseConfigured: boolean;
  sessionConfigured: boolean;
}

export default function Settings() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [aiEnabled, setAiEnabled] = useState(true);

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  const { data: healthStatus, isLoading: healthLoading, error: healthError } = useQuery<HealthStatus>({
    queryKey: ["/api/health"],
    enabled: isAuthenticated && !isLoading,
  });

  useEffect(() => {
    if (healthError && isUnauthorizedError(healthError as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [healthError, toast]);

  const toggleAiMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await apiRequest("POST", "/api/settings/ai", { enabled });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/health"] });
      toast({
        title: "AI Configuration Updated",
        description: `AI features have been ${aiEnabled ? 'enabled' : 'disabled'}.`,
      });
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
        description: "Failed to update AI configuration. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Redirect non-admin users
  if (!isAdmin) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar title="Access Denied" subtitle="Administrator access required" />
          <main className="flex-1 overflow-y-auto p-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You need administrator privileges to access system settings.
              </AlertDescription>
            </Alert>
          </main>
        </div>
      </div>
    );
  }

  const handleAiToggle = (enabled: boolean) => {
    setAiEnabled(enabled);
    toggleAiMutation.mutate(enabled);
  };

  const getStatusIndicator = (configured: boolean, label: string) => {
    if (configured) {
      return (
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm text-muted-foreground">{label} configured</span>
          <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>
        </div>
      );
    }
    
    return (
      <div className="flex items-center space-x-2">
        <XCircle className="h-4 w-4 text-red-600" />
        <span className="text-sm text-muted-foreground">{label} not configured</span>
        <Badge variant="destructive">Inactive</Badge>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar 
          title="System Settings"
          subtitle="Configure AI services and system preferences"
        />
        
        <main className="flex-1 overflow-y-auto p-6" data-testid="main-settings">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* System Status Overview */}
            <Card data-testid="card-system-status">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <SettingsIcon className="mr-2 h-5 w-5" />
                  System Status
                </CardTitle>
                <CardDescription>
                  Overview of system components and their configuration status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {healthLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Checking system status...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getStatusIndicator(healthStatus?.databaseConfigured ?? false, "Database")}
                    {getStatusIndicator(healthStatus?.sessionConfigured ?? false, "Authentication")}
                    {getStatusIndicator(healthStatus?.openaiConfigured ?? false, "OpenAI API")}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Configuration */}
            <Card data-testid="card-ai-configuration">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bot className="mr-2 h-5 w-5" />
                  AI Configuration
                </CardTitle>
                <CardDescription>
                  Manage artificial intelligence features and OpenAI integration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* OpenAI Status */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">OpenAI Integration</Label>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">API Connection Status</div>
                      {healthStatus?.openaiConfigured ? (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-600">Connected and configured</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span className="text-sm text-red-600">Not configured</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* AI Features Toggle */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">AI Features</Label>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">AI Recommendations</div>
                      <div className="text-sm text-muted-foreground">
                        Inventory recommendations, price optimization, and business insights
                      </div>
                    </div>
                    <Switch
                      checked={aiEnabled && (healthStatus?.openaiConfigured ?? false)}
                      onCheckedChange={handleAiToggle}
                      disabled={!healthStatus?.openaiConfigured || toggleAiMutation.isPending}
                      data-testid="switch-ai-recommendations"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">AI Chat Assistant</div>
                      <div className="text-sm text-muted-foreground">
                        Interactive chat for business queries and data analysis
                      </div>
                    </div>
                    <Switch
                      checked={aiEnabled && (healthStatus?.openaiConfigured ?? false)}
                      onCheckedChange={handleAiToggle}
                      disabled={!healthStatus?.openaiConfigured || toggleAiMutation.isPending}
                      data-testid="switch-ai-chat"
                    />
                  </div>
                </div>

                {!healthStatus?.openaiConfigured && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      OpenAI API key is not configured. AI features will use fallback data until configured. 
                      Contact your system administrator to configure the OpenAI API key in environment variables.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* General Settings */}
            <Card data-testid="card-general-settings">
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Company information and system preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-medium">Company Name</Label>
                      <div className="text-sm text-muted-foreground">Pharmaceutical Distribution Co.</div>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-medium">Default Currency</Label>
                      <div className="text-sm text-muted-foreground">USD</div>
                    </div>
                  </div>
                  
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Additional general settings will be available in future updates.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>

            {/* Feature Flags */}
            <Card data-testid="card-feature-flags">
              <CardHeader>
                <CardTitle>Feature Flags</CardTitle>
                <CardDescription>
                  Enable or disable specific system features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">Advanced Analytics</div>
                      <div className="text-sm text-muted-foreground">
                        Enhanced reporting and data visualization features
                      </div>
                    </div>
                    <Switch
                      checked={true}
                      disabled={true}
                      data-testid="switch-analytics"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">Mobile Notifications</div>
                      <div className="text-sm text-muted-foreground">
                        Push notifications for mobile applications
                      </div>
                    </div>
                    <Switch
                      checked={false}
                      disabled={true}
                      data-testid="switch-notifications"
                    />
                  </div>

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Additional feature flags will be available in future updates.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}