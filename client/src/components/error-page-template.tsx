import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowLeft, Home, RefreshCw, Wifi, WifiOff, Lock, Server, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";
import { SectionErrorBoundary } from "@/components/error-boundary";

export type ErrorType = 
  | "not-found" 
  | "network" 
  | "server" 
  | "unauthorized" 
  | "forbidden" 
  | "maintenance" 
  | "generic";

export interface ErrorPageTemplateProps {
  type: ErrorType;
  title?: string;
  message?: string;
  details?: string;
  showRefresh?: boolean;
  showGoBack?: boolean;
  showGoHome?: boolean;
  customActions?: Array<{
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "ghost" | "secondary" | "destructive" | "link";
    icon?: React.ReactNode;
  }>;
  className?: string;
}

const ErrorPageTemplate = ({
  type,
  title,
  message,
  details,
  showRefresh = true,
  showGoBack = true,
  showGoHome = true,
  customActions = [],
  className = "",
}: ErrorPageTemplateProps) => {
  const [location, navigate] = useLocation();

  // Error type configurations
  const errorConfigs = {
    "not-found": {
      icon: AlertCircle,
      iconColor: "text-orange-600",
      iconBg: "bg-orange-100",
      title: "404 - Page Not Found",
      message: "The page you're looking for doesn't exist or has been moved.",
      badge: "ROUTE ERROR",
      badgeColor: "bg-orange-100 text-orange-800",
    },
    "network": {
      icon: WifiOff,
      iconColor: "text-red-600",
      iconBg: "bg-red-100",
      title: "Connection Problem",
      message: "Unable to connect to the server. Please check your internet connection.",
      badge: "NETWORK ERROR",
      badgeColor: "bg-red-100 text-red-800",
    },
    "server": {
      icon: Server,
      iconColor: "text-purple-600",
      iconBg: "bg-purple-100",
      title: "Server Error",
      message: "Something went wrong on our end. Our team has been notified.",
      badge: "SERVER ERROR",
      badgeColor: "bg-purple-100 text-purple-800",
    },
    "unauthorized": {
      icon: Lock,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100",
      title: "Login Required",
      message: "You need to sign in to access this page.",
      badge: "AUTH ERROR",
      badgeColor: "bg-blue-100 text-blue-800",
    },
    "forbidden": {
      icon: AlertTriangle,
      iconColor: "text-yellow-600",
      iconBg: "bg-yellow-100",
      title: "Access Denied",
      message: "You don't have permission to access this resource.",
      badge: "PERMISSION ERROR",
      badgeColor: "bg-yellow-100 text-yellow-800",
    },
    "maintenance": {
      icon: AlertTriangle,
      iconColor: "text-indigo-600",
      iconBg: "bg-indigo-100",
      title: "Maintenance Mode",
      message: "We're currently performing maintenance. Please try again later.",
      badge: "MAINTENANCE",
      badgeColor: "bg-indigo-100 text-indigo-800",
    },
    "generic": {
      icon: AlertCircle,
      iconColor: "text-gray-600",
      iconBg: "bg-gray-100",
      title: "Something Went Wrong",
      message: "An unexpected error occurred. Please try again.",
      badge: "ERROR",
      badgeColor: "bg-gray-100 text-gray-800",
    },
  };

  const config = errorConfigs[type];
  const IconComponent = config.icon;

  const handleGoBack = () => {
    window.history.back();
  };

  const handleGoHome = () => {
    navigate("/");
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <SectionErrorBoundary 
      showDetails={true}
      data-testid={`${type}-error-boundary`}
    >
      <div className={`min-h-screen w-full flex items-center justify-center bg-gray-50 p-4 ${className}`} data-testid={`${type}-error-page`}>
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className={`mx-auto w-12 h-12 ${config.iconBg} rounded-full flex items-center justify-center mb-4`}>
              <IconComponent className={`w-6 h-6 ${config.iconColor}`} data-testid={`${type}-error-icon`} />
            </div>
            <CardTitle className="text-xl font-semibold" data-testid={`${type}-error-title`}>
              {title || config.title}
            </CardTitle>
            <div className="flex justify-center">
              <Badge variant="secondary" className={config.badgeColor} data-testid="error-type-badge">
                {config.badge}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center" data-testid="error-details">
              <p className="text-muted-foreground mb-2">
                {message || config.message}
              </p>
              {details && (
                <div className="text-sm text-gray-500 font-mono bg-gray-100 p-2 rounded">
                  {details}
                </div>
              )}
              {type === "not-found" && (
                <div className="text-sm text-gray-500 font-mono bg-gray-100 p-2 rounded">
                  Requested: <span data-testid="requested-path">{location}</span>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 justify-center" data-testid="recovery-actions">
              {showGoBack && (
                <Button onClick={handleGoBack} variant="default" size="sm" data-testid="button-go-back">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </Button>
              )}
              
              {showGoHome && (
                <Button onClick={handleGoHome} variant="outline" size="sm" data-testid="button-go-home">
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              )}
              
              {showRefresh && (
                <Button onClick={handleRefresh} variant="outline" size="sm" data-testid="button-refresh">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              )}

              {customActions.map((action, index) => (
                <Button 
                  key={index}
                  onClick={action.onClick} 
                  variant={action.variant || "outline"} 
                  size="sm" 
                  data-testid={`custom-action-${index}`}
                >
                  {action.icon && <span className="w-4 h-4 mr-2">{action.icon}</span>}
                  {action.label}
                </Button>
              ))}
            </div>

            {/* Error suggestions based on type */}
            {type === "network" && (
              <div className="pt-4 border-t text-center">
                <p className="text-xs text-gray-500 mb-2">Try these steps:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Check your internet connection</li>
                  <li>• Disable VPN if active</li>
                  <li>• Clear browser cache</li>
                </ul>
              </div>
            )}

            {type === "server" && (
              <div className="pt-4 border-t text-center">
                <p className="text-xs text-gray-500 mb-2">What can you do:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Wait a few minutes and try again</li>
                  <li>• Contact support if the problem persists</li>
                </ul>
              </div>
            )}

            {type === "unauthorized" && (
              <div className="pt-4 border-t text-center">
                <Button 
                  onClick={() => navigate("/login")} 
                  variant="default" 
                  size="sm" 
                  className="w-full"
                  data-testid="button-login"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SectionErrorBoundary>
  );
};

export default ErrorPageTemplate;