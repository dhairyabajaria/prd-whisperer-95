import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { createAppError, ErrorType, ErrorSeverity } from "@/components/error-boundary";

// Network error detection utilities
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return error.message.includes('Failed to fetch') ||
           error.message.includes('NetworkError') ||
           error.message.includes('ERR_NETWORK') ||
           error.message.includes('ERR_INTERNET_DISCONNECTED');
  }
  return false;
}

export function isRetryableError(error: unknown): boolean {
  // Network errors are retryable
  if (isNetworkError(error)) return true;
  
  // Check for retryable HTTP status codes
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as any).status;
    return status === 408 || // Request Timeout
           status === 429 || // Too Many Requests
           status === 500 || // Internal Server Error
           status === 502 || // Bad Gateway
           status === 503 || // Service Unavailable
           status === 504;   // Gateway Timeout
  }
  
  return false;
}

// Exponential backoff with jitter
export const createRetryDelay = (failureCount: number): number => {
  const baseDelay = 1000; // 1 second
  const maxDelay = 30000; // 30 seconds
  const jitterRange = 0.1; // 10% jitter
  
  // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (max)
  const exponentialDelay = Math.min(baseDelay * Math.pow(2, failureCount - 1), maxDelay);
  
  // Add jitter to prevent thundering herd
  const jitter = exponentialDelay * jitterRange * (Math.random() * 2 - 1);
  
  return Math.max(exponentialDelay + jitter, 0);
};

// Intelligent retry logic
export function shouldRetry(failureCount: number, error: unknown): boolean {
  // Don't retry beyond 3 attempts
  if (failureCount >= 3) return false;
  
  // Don't retry client errors (4xx) except specific cases
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as any).status;
    
    // Never retry these client errors
    if (status === 400 || // Bad Request
        status === 401 || // Unauthorized
        status === 403 || // Forbidden
        status === 404 || // Not Found
        status === 410 || // Gone
        status === 422) { // Unprocessable Entity
      return false;
    }
  }
  
  // Retry if it's a retryable error
  return isRetryableError(error);
}

// Enhanced error handling function that creates typed errors
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    
    // Create typed error based on status code
    let errorType = ErrorType.UNKNOWN;
    let errorSeverity = ErrorSeverity.MEDIUM;
    let userMessage = "";
    
    switch (res.status) {
      case 401:
        errorType = ErrorType.AUTH;
        errorSeverity = ErrorSeverity.HIGH;
        userMessage = "Your session has expired. Please log in again.";
        break;
      case 403:
        errorType = ErrorType.PERMISSION;
        errorSeverity = ErrorSeverity.HIGH;
        userMessage = "You don't have permission to access this resource.";
        break;
      case 404:
        errorType = ErrorType.ROUTE;
        errorSeverity = ErrorSeverity.MEDIUM;
        userMessage = "The requested resource was not found.";
        break;
      case 429:
        errorType = ErrorType.QUOTA;
        errorSeverity = ErrorSeverity.MEDIUM;
        userMessage = "Too many requests. Please wait a moment and try again.";
        break;
      case 500:
      case 502:
      case 503:
        errorType = ErrorType.SERVER;
        errorSeverity = ErrorSeverity.HIGH;
        userMessage = "Server error. Our team has been notified.";
        break;
      default:
        if (res.status >= 400 && res.status < 500) {
          errorType = ErrorType.VALIDATION;
          errorSeverity = ErrorSeverity.LOW;
          userMessage = "Please check your input and try again.";
        } else if (res.status >= 500) {
          errorType = ErrorType.SERVER;
          errorSeverity = ErrorSeverity.HIGH;
          userMessage = "Server error. Our team has been notified.";
        }
        break;
    }
    
    throw createAppError(
      `${res.status}: ${text}`,
      errorType,
      errorSeverity,
      userMessage,
      res.status.toString()
    );
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    // Enhance network errors
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw createAppError(
        "Network connection failed",
        ErrorType.NETWORK,
        ErrorSeverity.MEDIUM,
        "Connection problem. Please check your internet connection.",
        "NETWORK_ERROR"
      );
    }
    
    // Re-throw other errors (already typed from throwIfResNotOk)
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const url = queryKey.join("/") as string;
      console.log('🌐 Making API request to:', url);
      
      const res = await fetch(url, {
        credentials: "include",
      });

      console.log('🌐 API response status:', res.status, 'for URL:', url);

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log('🌐 Returning null for 401 response');
        return null;
      }

      await throwIfResNotOk(res);
      const data = await res.json();
      console.log('🌐 API response data for', url, ':', data);
      return data;
    } catch (error) {
      console.error('🌐 API request failed for', queryKey.join("/"), ':', error);
      
      // Enhance network errors for queries with detailed context
      if (isNetworkError(error)) {
        throw createAppError(
          "Failed to load data",
          ErrorType.NETWORK,
          ErrorSeverity.MEDIUM,
          "Unable to load data. Please check your connection and try again.",
          "QUERY_NETWORK_ERROR"
        );
      }
      
      // Re-throw other errors (already typed from throwIfResNotOk)
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 0, // Allow immediate cache invalidation
      // Enhanced retry configuration
      retry: shouldRetry,
      retryDelay: createRetryDelay,
      // Disable retry for successful data that becomes stale
      refetchOnReconnect: true,
      // Network mode for better offline handling
      networkMode: "online",
    },
    mutations: {
      // Enhanced retry configuration for mutations
      retry: (failureCount, error) => {
        // Be more conservative with mutations - only retry network errors
        if (failureCount >= 2) return false;
        return isNetworkError(error);
      },
      retryDelay: createRetryDelay,
      // Network mode for better offline handling
      networkMode: "online",
    },
  },
});
