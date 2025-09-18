import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowLeft, Home, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";
import { SectionErrorBoundary, createAppError, ErrorType, ErrorSeverity } from "@/components/error-boundary";

export default function NotFound() {
  const [location, navigate] = useLocation();

  const handleGoBack = () => {
    window.history.back();
  };

  const handleGoHome = () => {
    navigate("/");
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  // Demonstrate error boundary with a 404-specific error
  const simulateRouteError = () => {
    const routeError = createAppError(
      "Page not found",
      ErrorType.ROUTE,
      ErrorSeverity.MEDIUM,
      "The page you're looking for doesn't exist or has been moved.",
      "404"
    );
    routeError.context = { requestedPath: location };
    throw routeError;
  };

  return (
    <SectionErrorBoundary 
      level="page" 
      showDetails={true}
      data-testid="not-found-error-boundary"
    >
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4" data-testid="not-found-page">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-orange-600" data-testid="not-found-icon" />
            </div>
            <CardTitle className="text-xl font-semibold" data-testid="not-found-title">
              404 - Page Not Found
            </CardTitle>
            <div className="flex justify-center">
              <Badge variant="secondary" className="bg-orange-100 text-orange-800" data-testid="error-type-badge">
                ROUTE ERROR
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center" data-testid="error-details">
              <p className="text-muted-foreground mb-2">
                The page you're looking for doesn't exist or has been moved.
              </p>
              <div className="text-sm text-gray-500 font-mono bg-gray-100 p-2 rounded">
                Requested: <span data-testid="requested-path">{location}</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 justify-center" data-testid="recovery-actions">
              <Button onClick={handleGoBack} variant="default" size="sm" data-testid="button-go-back">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              
              <Button onClick={handleGoHome} variant="outline" size="sm" data-testid="button-go-home">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
              
              <Button onClick={handleRefresh} variant="outline" size="sm" data-testid="button-refresh">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-center text-gray-500 mb-2">
                Development Testing:
              </p>
              <Button 
                onClick={simulateRouteError} 
                variant="ghost" 
                size="sm" 
                className="w-full text-xs" 
                data-testid="button-simulate-error"
              >
                Simulate Route Error (Test Error Boundary)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </SectionErrorBoundary>
  );
}
