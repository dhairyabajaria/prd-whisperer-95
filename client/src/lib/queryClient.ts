import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { createAppError, ErrorType, ErrorSeverity } from "@/components/error-boundary";

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
      const res = await fetch(queryKey.join("/") as string, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      // Enhance network errors for queries
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
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
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
