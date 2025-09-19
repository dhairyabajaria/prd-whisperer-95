import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
    refetchOnMount: true, // Always check auth status on mount
    staleTime: 0, // Don't cache auth data
    queryFn: async () => {
      try {
        const res = await fetch('/api/auth/user', {
          credentials: 'include',
        });
        
        // Return null for 401 responses (not authenticated)
        if (res.status === 401) {
          return null;
        }
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        return await res.json();
      } catch (error) {
        console.error('Auth query error:', error);
        return null; // Return null instead of throwing on auth errors
      }
    },
  });

  // Debug logging to help diagnose authentication issues
  console.log('🔍 Auth Debug:', { 
    user, 
    isLoading, 
    error: error?.message || error, 
    isAuthenticated: !!user,
    timestamp: new Date().toISOString()
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
