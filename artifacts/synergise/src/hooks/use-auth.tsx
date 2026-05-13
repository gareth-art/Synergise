import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

export interface User {
  id: number;
  fullName: string;
  email: string;
  username: string;
  subscriptionTier: string;
  trialStartDate?: string | null;
  aiCreditsRemaining?: number | null;
  aiCreditsMonthlyAllowance?: number | null;
  creditsResetDate?: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      // 401 means not logged in — return null, not an error
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Auth check failed");
      return res.json();
    },
    // Cache for 60s — prevents immediate background refetch after setQueryData
    staleTime: 60 * 1000,
    retry: false,
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        // Only check !!user — never use !error, which causes false logouts
        // when a background refetch transiently fails
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
