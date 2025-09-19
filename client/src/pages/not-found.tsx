import { createAppError, ErrorType, ErrorSeverity } from "@/components/error-boundary";
import { Button } from "@/components/ui/button";
import ErrorPageTemplate from "@/components/error-page-template";
import { useLocation } from "wouter";

export default function NotFound() {
  const [location] = useLocation();

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
    <ErrorPageTemplate
      type="not-found"
      customActions={[
        {
          label: "Simulate Route Error (Test Error Boundary)",
          onClick: simulateRouteError,
          variant: "ghost",
        }
      ]}
    />
  );
}
