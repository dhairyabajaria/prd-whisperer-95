import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, ArrowLeft, LogOut, Phone, Wifi, Server, Shield, AlertCircle, Home, RotateCcw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

// Error types for different scenarios
export enum ErrorType {
  NETWORK = "network",
  AUTH = "auth", 
  VALIDATION = "validation",
  SERVER = "server",
  ROUTE = "route",
  STATE = "state",
  PERMISSION = "permission",
  QUOTA = "quota",
  UNKNOWN = "unknown"
}

// Error severity levels
export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium", 
  HIGH = "high",
  CRITICAL = "critical"
}

// Enhanced error interface
interface AppError extends Error {
  type?: ErrorType;
  severity?: ErrorSeverity;
  code?: string;
  context?: Record<string, any>;
  userMessage?: string;
  recoveryActions?: string[];
}

// Props for error boundary
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: AppError, reset: () => void) => ReactNode;
  onError?: (error: AppError, errorInfo: ErrorInfo) => void;
  level?: "page" | "section" | "component";
  showDetails?: boolean;
}

// State for error boundary  
interface ErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

// Error classification utility
class ErrorClassifier {
  static classify(error: Error): AppError {
    const appError = error as AppError;
    
    // If already classified, return as-is
    if (appError.type) {
      return appError;
    }

    // Classify based on error message patterns
    const message = error.message.toLowerCase();
    
    if (message.includes("401") || message.includes("unauthorized")) {
      appError.type = ErrorType.AUTH;
      appError.severity = ErrorSeverity.HIGH;
      appError.userMessage = "Your session has expired. Please log in again.";
      appError.recoveryActions = ["login", "refresh"];
    } else if (message.includes("403") || message.includes("forbidden")) {
      appError.type = ErrorType.PERMISSION;
      appError.severity = ErrorSeverity.HIGH;
      appError.userMessage = "You don't have permission to access this resource.";
      appError.recoveryActions = ["contact_support", "go_back"];
    } else if (message.includes("network") || message.includes("fetch") || message.includes("timeout")) {
      appError.type = ErrorType.NETWORK;
      appError.severity = ErrorSeverity.MEDIUM;
      appError.userMessage = "Connection problem. Please check your internet connection.";
      appError.recoveryActions = ["retry", "refresh"];
    } else if (message.includes("500") || message.includes("server")) {
      appError.type = ErrorType.SERVER;
      appError.severity = ErrorSeverity.HIGH;
      appError.userMessage = "Server error. Our team has been notified.";
      appError.recoveryActions = ["retry", "contact_support"];
    } else if (message.includes("quota") || message.includes("limit")) {
      appError.type = ErrorType.QUOTA;
      appError.severity = ErrorSeverity.MEDIUM;
      appError.userMessage = "Service limit reached. Please try again later.";
      appError.recoveryActions = ["wait", "contact_support"];
    } else if (message.includes("validation") || message.includes("invalid")) {
      appError.type = ErrorType.VALIDATION;
      appError.severity = ErrorSeverity.LOW;
      appError.userMessage = "Please check your input and try again.";
      appError.recoveryActions = ["fix_input", "reset_form"];
    } else if (message.includes("route") || message.includes("not found")) {
      appError.type = ErrorType.ROUTE;
      appError.severity = ErrorSeverity.MEDIUM;
      appError.userMessage = "Page not found. The link may be broken or outdated.";
      appError.recoveryActions = ["go_home", "go_back"];
    } else {
      appError.type = ErrorType.UNKNOWN;
      appError.severity = ErrorSeverity.HIGH;
      appError.userMessage = "An unexpected error occurred. Please try refreshing the page.";
      appError.recoveryActions = ["refresh", "contact_support"];
    }

    return appError;
  }
}

// Error logging utility
class ErrorLogger {
  static log(error: AppError, errorInfo: ErrorInfo, context?: Record<string, any>) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      type: error.type,
      severity: error.severity,
      code: error.code,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      context: { ...error.context, ...context },
      componentStack: errorInfo.componentStack
    };

    // Log to console in development
    if (import.meta.env.DEV) {
      console.group(`🚨 Error Boundary [${error.type}/${error.severity}]`);
      console.error("Error:", error);
      console.error("Error Info:", errorInfo);
      console.error("Context:", context);
      console.groupEnd();
    }

    // In production, send to monitoring service
    // TODO: Integrate with error tracking service like Sentry
    try {
      // Example: Send to analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'exception', {
          description: error.message,
          fatal: error.severity === ErrorSeverity.CRITICAL
        });
      }
    } catch (loggingError) {
      console.warn("Failed to log error:", loggingError);
    }
  }
}

// Recovery actions component
interface RecoveryActionsProps {
  error: AppError;
  onRetry: () => void;
  onRefresh: () => void;
  onGoBack: () => void;
  onGoHome: () => void;
  onLogout: () => void;
  onContactSupport: () => void;
}

function RecoveryActions({ error, onRetry, onRefresh, onGoBack, onGoHome, onLogout, onContactSupport }: RecoveryActionsProps) {
  const actions = error.recoveryActions || [];

  return (
    <div className="flex flex-wrap gap-2 mt-4" data-testid="error-recovery-actions">
      {actions.includes("retry") && (
        <Button onClick={onRetry} variant="default" size="sm" data-testid="button-retry-error">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      )}
      
      {actions.includes("refresh") && (
        <Button onClick={onRefresh} variant="outline" size="sm" data-testid="button-refresh-page">
          <RotateCcw className="w-4 h-4 mr-2" />
          Refresh Page
        </Button>
      )}
      
      {actions.includes("go_back") && (
        <Button onClick={onGoBack} variant="outline" size="sm" data-testid="button-go-back">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      )}
      
      {actions.includes("go_home") && (
        <Button onClick={onGoHome} variant="outline" size="sm" data-testid="button-go-home">
          <Home className="w-4 h-4 mr-2" />
          Go Home
        </Button>
      )}
      
      {(actions.includes("login") || actions.includes("logout")) && (
        <Button onClick={onLogout} variant="outline" size="sm" data-testid="button-logout">
          <LogOut className="w-4 h-4 mr-2" />
          {actions.includes("login") ? "Log In Again" : "Logout"}
        </Button>
      )}
      
      {actions.includes("contact_support") && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" data-testid="button-contact-support">
              <Phone className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent data-testid="dialog-contact-support">
            <AlertDialogHeader>
              <AlertDialogTitle>Contact Support</AlertDialogTitle>
              <AlertDialogDescription>
                Need help with this error? Our support team is here to assist you.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2 my-4">
              <p className="text-sm"><strong>Error Code:</strong> {error.code || "N/A"}</p>
              <p className="text-sm"><strong>Time:</strong> {new Date().toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Include this information when contacting support.</p>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
              <AlertDialogAction onClick={onContactSupport} data-testid="button-confirm-contact">
                Contact Support
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

// Error display component
interface ErrorDisplayProps {
  error: AppError;
  level: "page" | "section" | "component";
  showDetails: boolean;
  onRetry: () => void;
  children: ReactNode;
}

function ErrorDisplay({ error, level, showDetails, onRetry, children }: ErrorDisplayProps) {
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

  if (level === "page") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4" data-testid="error-boundary-page">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Icon className="w-6 h-6 text-red-600" data-testid="error-icon" />
            </div>
            <CardTitle className="text-xl font-semibold" data-testid="error-title">
              Oops! Something went wrong
            </CardTitle>
            <div className="flex justify-center">
              <Badge variant="secondary" className={getSeverityColor(error.severity!)} data-testid="error-severity">
                {error.severity?.toUpperCase()} - {error.type?.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground" data-testid="error-message">
              {error.userMessage || "An unexpected error occurred."}
            </p>
            
            {showDetails && (
              <Alert variant="destructive" data-testid="error-details">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Technical Details</AlertTitle>
                <AlertDescription className="font-mono text-sm mt-2">
                  {error.message}
                </AlertDescription>
              </Alert>
            )}
            
            {children}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (level === "section") {
    return (
      <div className="w-full p-4" data-testid="error-boundary-section">
        <Alert variant="destructive">
          <Icon className="h-4 w-4" />
          <AlertTitle className="flex items-center gap-2">
            Error in this section
            <Badge variant="secondary" className={getSeverityColor(error.severity!)}>
              {error.type?.toUpperCase()}
            </Badge>
          </AlertTitle>
          <AlertDescription className="mt-2">
            {error.userMessage || "This section couldn't load properly."}
            {showDetails && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium">Show technical details</summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                  {error.message}
                </pre>
              </details>
            )}
          </AlertDescription>
          <div className="mt-3">
            {children}
          </div>
        </Alert>
      </div>
    );
  }

  // Component level - minimal inline error
  return (
    <div className="p-2 border border-red-200 rounded bg-red-50" data-testid="error-boundary-component">
      <div className="flex items-center gap-2 text-sm text-red-700">
        <Icon className="w-4 h-4" />
        <span>{error.userMessage || "Component error"}</span>
        {children}
      </div>
    </div>
  );
}

// Main Error Boundary component
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private maxRetries = 3;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const classifiedError = ErrorClassifier.classify(error);
    return {
      hasError: true,
      error: classifiedError
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const classifiedError = ErrorClassifier.classify(error);
    
    // Log the error
    ErrorLogger.log(classifiedError, errorInfo);
    
    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(classifiedError, errorInfo);
    }
    
    // Update state with error info
    this.setState({ errorInfo });
    
    // Show toast notification for non-critical errors
    if (classifiedError.severity !== ErrorSeverity.CRITICAL) {
      toast({
        title: "Something went wrong",
        description: classifiedError.userMessage || "An error occurred",
        variant: "destructive",
      });
    }
  }

  handleRetry = () => {
    if (this.state.retryCount >= this.maxRetries) {
      toast({
        title: "Too many retry attempts",
        description: "Please refresh the page or contact support",
        variant: "destructive",
      });
      return;
    }

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleRefresh = () => {
    window.location.reload();
  };

  handleGoBack = () => {
    window.history.back();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  handleLogout = () => {
    // Clear any stored auth data
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/api/logout";
  };

  handleContactSupport = () => {
    // Open support email or chat
    const subject = encodeURIComponent(`Error Report: ${this.state.error?.type || 'Unknown'}`);
    const body = encodeURIComponent(`
Error Details:
- Type: ${this.state.error?.type || 'Unknown'}
- Message: ${this.state.error?.message || 'No message'}
- Time: ${new Date().toISOString()}
- Page: ${window.location.href}
- User Agent: ${navigator.userAgent}

Please describe what you were doing when this error occurred:
[Your description here]
    `.trim());
    
    window.open(`mailto:support@example.com?subject=${subject}&body=${body}`);
  };

  render() {
    const { children, fallback, level = "page", showDetails = false } = this.props;
    const { hasError, error } = this.state;

    if (!hasError) {
      return children;
    }

    if (!error) {
      return <div data-testid="error-boundary-unknown">Unknown error occurred</div>;
    }

    // Custom fallback
    if (fallback) {
      return fallback(error, this.handleRetry);
    }

    // Default error UI with recovery actions
    return (
      <ErrorDisplay 
        error={error} 
        level={level} 
        showDetails={showDetails || import.meta.env.DEV}
        onRetry={this.handleRetry}
      >
        <RecoveryActions
          error={error}
          onRetry={this.handleRetry}
          onRefresh={this.handleRefresh}
          onGoBack={this.handleGoBack}
          onGoHome={this.handleGoHome}
          onLogout={this.handleLogout}
          onContactSupport={this.handleContactSupport}
        />
      </ErrorDisplay>
    );
  }
}

// Specialized error boundaries for different use cases

export function PageErrorBoundary({ children, ...props }: Omit<ErrorBoundaryProps, "level">) {
  return (
    <ErrorBoundary level="page" {...props}>
      {children}
    </ErrorBoundary>
  );
}

export function SectionErrorBoundary({ children, ...props }: Omit<ErrorBoundaryProps, "level">) {
  return (
    <ErrorBoundary level="section" {...props}>
      {children}
    </ErrorBoundary>
  );
}

export function ComponentErrorBoundary({ children, ...props }: Omit<ErrorBoundaryProps, "level">) {
  return (
    <ErrorBoundary level="component" {...props}>
      {children}
    </ErrorBoundary>
  );
}

// Hook for programmatically throwing errors (useful for testing)
export function useErrorHandler() {
  return (error: Error | string, context?: Record<string, any>) => {
    const errorObj = typeof error === "string" ? new Error(error) : error;
    if (context) {
      (errorObj as AppError).context = context;
    }
    throw errorObj;
  };
}

// Utility to create typed errors
export function createAppError(
  message: string, 
  type: ErrorType = ErrorType.UNKNOWN,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  userMessage?: string,
  code?: string
): AppError {
  const error = new Error(message) as AppError;
  error.type = type;
  error.severity = severity;
  error.userMessage = userMessage;
  error.code = code;
  return error;
}

// HOC for wrapping components with error boundaries
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">
) {
  const WithErrorBoundaryComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );
  
  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithErrorBoundaryComponent;
}

export type { AppError };