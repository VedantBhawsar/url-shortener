import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { useAuthStore, selectIsAuthenticated, User } from "@/store/authStore";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ShortLink {
  id: string;
  originalUrl: string;
  shortUrl: string;
  userId: string;
  clicksCount: number;
  status: boolean;
  expiresAt: string | null;
  blockedRegions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ClickEvent {
  id: string;
  shortLinkId: string;
  ipAddress: string;
  userAgent: string;
  referer: string;
  country: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
  device: string;
  browser: string;
  os: string;
  createdAt: string;
  updatedAt: string;
}

export interface Analytics {
  clicks: ClickEvent[];
  clicksCount: number;
}

// ─── Billing Types ────────────────────────────────────────────────────────────

export type SubscriptionStatus = "ACTIVE" | "PAST_DUE" | "CANCELED" | "EXPIRED" | "free";
export type PlanId = "free" | "premium";

export interface SubscriptionStatusResponse {
  planId: PlanId;
  planName: string;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  usage: {
    linksUsed: number;
    linksLimit: number;
    percentage: number;
  };
  features: {
    customExpiry: boolean;
    regionBlocking: boolean;
    fullAnalytics: boolean;
  };
  upgradeRequired: boolean;
}

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const queryKeys = {
  me: ["user", "me"] as const,
  links: ["links"] as const,
  link: (id: string) => ["links", id] as const,
  analytics: (id: string) => ["links", id, "analytics"] as const,
  subscriptionStatus: ["billing", "subscription-status"] as const,
};

// ─── Auth Mutations ───────────────────────────────────────────────────────────

export function useRegister() {
  const { setLoggedIn } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; email: string; password: string }) =>
      // Server sets httpOnly cookies on success; response just has a message
      apiRequest<{ data: { message: string } }>("/auth/register", {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      setLoggedIn(true);
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
    },
  });
}

export function useLogin() {
  const { setLoggedIn } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      // Server sets httpOnly cookies on success; response just has a message
      apiRequest<{ data: { message: string } }>("/auth/login", {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      setLoggedIn(true);
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
    },
  });
}

export function useLogout() {
  const { setLoggedIn } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      // Server clears the httpOnly cookies; no body needed
      apiRequest("/auth/logout", { method: "POST" }),
    onSettled: () => {
      // Clear regardless of server response — cookies may already be expired
      setLoggedIn(false);
      queryClient.clear();
    },
  });
}

// ─── User Queries ─────────────────────────────────────────────────────────────

export function useMe() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () => apiRequest<{ data: User }>("/users/me"),
    // Only fire once we know the user is (likely) logged in
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Pick<User, "name" | "email">>) =>
      apiRequest<{ data: User }>("/users/me", { method: "PATCH", body: data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.me }),
  });
}

export function useDeleteMe() {
  const { setLoggedIn } = useAuthStore();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest("/users/me", { method: "DELETE" }),
    onSuccess: () => {
      setLoggedIn(false);
      queryClient.clear();
    },
  });
}

// ─── Link Queries ─────────────────────────────────────────────────────────────

export function useLinks() {
  return useQuery({
    queryKey: queryKeys.links,
    queryFn: () => apiRequest<{ data: ShortLink[] }>("/links"),
    staleTime: 1000 * 30,
  });
}

export function useLink(id: string) {
  return useQuery({
    queryKey: queryKeys.link(id),
    queryFn: () => apiRequest<{ data: ShortLink }>(`/links/${id}`),
    enabled: !!id,
  });
}

export function useCreateLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      originalUrl: string;
      shortUrl?: string;
      expiresAt?: string;
      blockedRegions?: string[];
    }) =>
      apiRequest<{ data: ShortLink }>("/links", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.links });
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptionStatus });
    },
  });
}

export function useUpdateLink(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      data: Partial<
        Pick<ShortLink, "originalUrl" | "shortUrl" | "status" | "blockedRegions"> & {
          expiresAt: string | null;
        }
      >
    ) =>
      apiRequest<{ data: ShortLink }>(`/links/${id}`, {
        method: "PATCH",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.links });
      queryClient.invalidateQueries({ queryKey: queryKeys.link(id) });
    },
  });
}

export function useDeleteLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/links/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.links });
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptionStatus });
    },
  });
}

export function useAnalytics(id: string) {
  return useQuery({
    queryKey: queryKeys.analytics(id),
    queryFn: () =>
      apiRequest<{ data: Analytics }>(`/links/${id}/analytics`),
    enabled: !!id,
    staleTime: 1000 * 60,
  });
}

// ─── Billing Queries ──────────────────────────────────────────────────────────

export function useSubscriptionStatus() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery({
    queryKey: queryKeys.subscriptionStatus,
    queryFn: () =>
      apiRequest<{ data: SubscriptionStatusResponse }>("/billing/subscription-status"),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: () =>
      apiRequest<{ data: { url: string } }>("/billing/create-checkout-session", {
        method: "POST",
      }),
    onSuccess: (res) => {
      // Redirect to Stripe Checkout
      window.location.href = res.data.url;
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiRequest<{ data: { message: string } }>("/billing/cancel", {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptionStatus });
    },
  });
}
