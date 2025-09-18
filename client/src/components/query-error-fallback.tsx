import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, RefreshCw, Home, ArrowLeft, Wifi, Server, Shield, AlertCircle } from "lucide-react";
import { AppError, ErrorType, ErrorSeverity } from "@/components/error-boundary";

interface QueryErrorFallbackProps {
  error: AppError;
  onRetry?: () => void;
  onRefresh?: () => void;
  onGoBack?: () => void;
  onGoHome?: () => void;
  level?: "card" | "inline" | "alert";
  showDetails?: boolean;
}

export function QueryErrorFallback({ 
  error, 
  onRetry, 
  onRefresh, 
  onGoBack, 
  onGoHome,
  level = "alert",
  showDetails = false 
}: QueryErrorFallbackProps) {
  const getErrorIcon = (type: ErrorType) => {
    switch (type) {
      case ErrorType.NETWORK: return Wifi;
      case ErrorType.AUTH: return Shield;
      case ErrorType.SERVER: return Server;
      case ErrorType.PERMISSION: return Shield;
      case ErrorType.ROUTE: return AlertCircle;
      default: return AlertTriangle;
    }
  };

  const getSeverityColor = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.LOW: return "bg-yellow-100 text-yellow-800";
      case ErrorSeverity.MEDIUM: return "bg-orange-100 text-orange-800";  
      case ErrorSeverity.HIGH: return "bg-red-100 text-red-800";
      case ErrorSeverity.CRITICAL: return "bg-red-200 text-red-900";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const Icon = getErrorIcon(error.type!);

  const renderActions = () => {
    if (!onRetry && !onRefresh && !onGoBack && !onGoHome) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-3" data-testid="query-error-actions">
        {onRetry && (
          <Button onClick={onRetry} size="sm" data-testid="button-retry-query">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
        
        {onRefresh && (
          <Button onClick={onRefresh} variant="outline" size="sm" data-testid="button-refresh-query">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Page
          </Button>
        )}
        
        {onGoBack && (
          <Button onClick={onGoBack} variant="outline" size="sm" data-testid="button-go-back-query">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        )}
        
        {onGoHome && (
          <Button onClick={onGoHome} variant="outline" size="sm" data-testid="button-go-home-query">
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
        )}
      </div>
    );
  };

  if (level === "card") {
    return (
      <Card className="w-full" data-testid="query-error-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Icon className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">Unable to load data</CardTitle>
              <Badge variant="secondary" className={getSeverityColor(error.severity!)}>
                {error.type?.toUpperCase()} ERROR
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-3" data-testid="query-error-message">
            {error.userMessage || "Something went wrong while loading the data."}
          </p>
          
          {showDetails && (
            <details className="mb-3">
              <summary className="cursor-pointer text-sm font-medium">Show technical details</summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto" data-testid="query-error-details">
                {error.message}
              </pre>
            </details>
          )}
          
          {renderActions()}
        </CardContent>
      </Card>
    );
  }

  if (level === "inline") {
    return (
      <div className="flex items-center gap-3 p-3 border border-red-200 rounded bg-red-50" data-testid="query-error-inline">
        <Icon className="w-5 h-5 text-red-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-800">{error.userMessage || "Failed to load data"}</p>
          {showDetails && (
            <p className="text-xs text-red-600 mt-1 truncate" data-testid="query-error-details-inline">{error.message}</p>
          )}
        </div>
        {onRetry && (
          <Button onClick={onRetry} size="sm" variant="outline" data-testid="button-retry-inline">
            <RefreshCw className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  }

  // Default: alert level
  return (
    <Alert variant="destructive" data-testid="query-error-alert">
      <Icon className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        Data loading failed
        <Badge variant="secondary" className={getSeverityColor(error.severity!)}>
          {error.type?.toUpperCase()}
        </Badge>
      </AlertTitle>
      <AlertDescription>
        <p className="mb-2" data-testid="query-error-message-alert">
          {error.userMessage || "Unable to load the requested data. Please try again."}
        </p>
        
        {showDetails && (
          <details>
            <summary className="cursor-pointer text-sm font-medium">Show technical details</summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto" data-testid="query-error-details-alert">
              {error.message}
            </pre>
          </details>
        )}
        
        {renderActions()}
      </AlertDescription>
    </Alert>
  );
}

// Hook for using query error fallback with common patterns
export function useQueryErrorHandler(refetch?: () => void) {
  const handleRetry = () => {
    if (refetch) {
      refetch();
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoBack = () => {
    window.history.back();
  };

  const handleGoHome = () => {
    window.location.href = "/";
  };

  const renderErrorFallback = (
    error: unknown,
    level: "card" | "inline" | "alert" = "alert",
    showDetails = false
  ) => {
    // Ensure error is an AppError
    const appError = error as AppError;
    
    return (
      <QueryErrorFallback
        error={appError}
        onRetry={refetch ? handleRetry : undefined}
        onRefresh={handleRefresh}
        onGoBack={handleGoBack}
        onGoHome={handleGoHome}
        level={level}
        showDetails={showDetails}
      />
    );
  };

  return {
    handleRetry,
    handleRefresh,
    handleGoBack,
    handleGoHome,
    renderErrorFallback
  };
}