import { useAuthStore } from "@/store/authStore";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Token refresh queue ──────────────────────────────────────────────────────
// If multiple requests 401 simultaneously, only one refresh call is made.
// All others wait for the same result.

let isRefreshing = false;
let refreshQueue: Array<(didRefresh: boolean) => void> = [];

async function attemptRefresh(): Promise<boolean> {
  if (isRefreshing) {
    return new Promise((resolve) => refreshQueue.push(resolve));
  }

  isRefreshing = true;

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      // httpOnly cookie is sent automatically by the browser
      credentials: "include",
    });

    const succeeded = res.ok;
    refreshQueue.forEach((cb) => cb(succeeded));
    refreshQueue = [];
    return succeeded;
  } catch {
    refreshQueue.forEach((cb) => cb(false));
    refreshQueue = [];
    return false;
  } finally {
    isRefreshing = false;
  }
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

async function fetchJson<T>(path: string, options: RequestOptions): Promise<T> {
  const { method = "GET", body } = options;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    // 'include' sends cookies cross-origin (needed when API is on a different port)
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(res.status, json?.error ?? json?.message ?? "An error occurred", json);
  }

  return json as T;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Makes an authenticated API request.
 * On 401 the client attempts a silent token refresh (cookie-based) then retries once.
 * If the refresh also fails, the user is logged out.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  try {
    return await fetchJson<T>(path, options);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      const refreshed = await attemptRefresh();

      if (refreshed) {
        // Retry the original request — new access token cookie is now set
        return fetchJson<T>(path, options);
      }

      // Refresh failed — clear the login flag and let the router redirect
      useAuthStore.getState().setLoggedIn(false);
    }

    throw err;
  }
}