import { useQuery, useQueryClient } from "@tanstack/react-query";

export interface User {
  id: number;
  email: string;
  fullName: string;
  username: string;
  subscriptionTier: string;
  trialStartDate?: string | null;
  aiCreditsRemaining?: number | null;
  aiCreditsMonthlyAllowance?: number | null;
  creditsResetDate?: string | null;
}

async function fetchMe(): Promise<User | null> {
  const res = await fetch("/api/auth/me", { credentials: "include" });
  if (res.status === 401) return null;
  if (!res.ok) return null; // any error = treat as logged out, never throw
  return res.json();
}

export function useAuth() {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["auth-user"],
    queryFn: fetchMe,
    staleTime: 10 * 60 * 1000,    // 10 minutes — no background refetch after setQueryData
    gcTime: 15 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,         // do NOT refetch if data already in cache
  });

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
  };
}

export function useSetAuth() {
  const queryClient = useQueryClient();
  return (user: User | null) => {
    queryClient.setQueryData(["auth-user"], user);
  };
}
