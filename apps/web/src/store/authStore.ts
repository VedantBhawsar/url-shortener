import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  // ── persisted ───────────────────────────────────────────────────────────────
  // Tokens live in httpOnly cookies managed by the server.
  // We only persist a lightweight flag so the UI knows to attempt protected
  // routes without waiting for a network round-trip on every page load.
  isLoggedIn: boolean;

  // ── ephemeral ───────────────────────────────────────────────────────────────
  /** True once zustand/persist has finished reading localStorage */
  _hasHydrated: boolean;

  // ── actions ─────────────────────────────────────────────────────────────────
  setLoggedIn: (value: boolean) => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      _hasHydrated: false,

      setLoggedIn: (value) => set({ isLoggedIn: value }),
      setHasHydrated: (value) => set({ _hasHydrated: value }),
    }),
    {
      name: "url-shortener-auth",
      storage: createJSONStorage(() => localStorage),

      // Only persist the login flag — _hasHydrated is always runtime-only
      partialize: (state) => ({ isLoggedIn: state.isLoggedIn }),

      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectIsAuthenticated = (s: AuthState) =>
  s._hasHydrated && s.isLoggedIn;

export const selectIsHydrating = (s: AuthState) => !s._hasHydrated;