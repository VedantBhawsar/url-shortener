import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { useAuthStore, selectIsAuthenticated, selectIsHydrating } from "@/store/authStore";
import { AuthPage } from "@/pages/AuthPage";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LinksPage } from "@/pages/LinksPage";
import { AnalyticsPage } from "@/pages/AnalyticsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { RedirectPage } from "@/pages/RedirectPage";

// ─── Query Client ─────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// ─── Hydration Spinner ────────────────────────────────────────────────────────

/**
 * Shown while Zustand persist reads localStorage.
 * Typically resolves in < 10ms — avoids a flash of wrong redirect.
 */
function HydrationLoader() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-500 animate-pulse" />
        <span className="text-xs text-zinc-600 font-mono tracking-wider">
          loading…
        </span>
      </div>
    </div>
  );
}

// ─── Route Guards ─────────────────────────────────────────────────────────────

/**
 * Public guard — shows nothing (not even children) until hydration is done.
 * Authenticated users are redirected to dashboard; others see the auth page.
 */
function PublicGuard() {
  const isHydrating = useAuthStore(selectIsHydrating);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  if (isHydrating) return <HydrationLoader />;
  return isAuthenticated ? <Navigate to="/dashboard/links" replace /> : <Outlet />;
}

/**
 * Private guard — same hydration gate.
 * Unauthenticated users are sent to login; authenticated users see the layout.
 */
function PrivateGuard() {
  const isHydrating = useAuthStore(selectIsHydrating);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  if (isHydrating) return <HydrationLoader />;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

function AppRoutes() {
  return (
    <Routes>
      {/* Root → redirect based on auth (PrivateGuard handles it) */}
      <Route index element={<Navigate to="/dashboard/links" replace />} />

      {/* Public: redirect away if already authenticated */}
      <Route element={<PublicGuard />}>
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
      </Route>

      {/* Protected: dashboard with shared sidebar layout */}
      <Route element={<PrivateGuard />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Navigate to="links" replace />} />
          <Route path="links" element={<LinksPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="analytics/:linkId" element={<AnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Public redirect interstitial — no auth required */}
      <Route path="/go/:shortUrl" element={<RedirectPage />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard/links" replace />} />
    </Routes>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider delayDuration={300}>
          <AppRoutes />
          <Toaster richColors position="bottom-right" />
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}