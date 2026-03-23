import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ExternalLink, ShieldCheck, Link2, AlertTriangle } from "lucide-react";
import { ApiError } from "@/lib/api";

// ─── Config ───────────────────────────────────────────────────────────────────

const COUNTDOWN_SECONDS = 5;
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

// ─── Types ────────────────────────────────────────────────────────────────────

type PageState =
  | { status: "loading" }
  | { status: "ready"; originalUrl: string; domain: string }
  | { status: "error"; message: string }
  | { status: "redirecting"; originalUrl: string };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// ─── Countdown Ring ───────────────────────────────────────────────────────────

function CountdownRing({
  seconds,
  total,
}: {
  seconds: number;
  total: number;
}) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const progress = seconds / total;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      <svg
        className="absolute inset-0 -rotate-90"
        width="80"
        height="80"
        viewBox="0 0 80 80"
      >
        {/* Track */}
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-zinc-800"
        />
        {/* Progress */}
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="text-indigo-500 transition-all duration-1000 ease-linear"
        />
      </svg>
      <span className="text-2xl font-bold text-white tabular-nums font-mono">
        {seconds}
      </span>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-5 w-48 bg-zinc-800 rounded mx-auto" />
      <div className="h-3 w-72 bg-zinc-800/60 rounded mx-auto" />
    </div>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────

function ErrorState({ message }: { message: string }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-950/60 border border-red-800/50 flex items-center justify-center">
        <AlertTriangle className="w-6 h-6 text-red-400" />
      </div>
      <div>
        <p className="text-white font-semibold text-base">Link unavailable</p>
        <p className="text-zinc-500 text-sm mt-1 max-w-xs">{message}</p>
      </div>
      <button
        onClick={() => navigate("/")}
        className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
      >
        Go to homepage →
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function RedirectPage() {
  const { shortUrl } = useParams<{ shortUrl: string }>();
  const [state, setState] = useState<PageState>({ status: "loading" });
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── 1. Resolve the short URL → originalUrl ───────────────────────────────

  useEffect(() => {
    if (!shortUrl) {
      setState({ status: "error", message: "No short URL provided." });
      return;
    }

    let cancelled = false;

    async function resolve() {
      try {
        const res = await fetch(`${BASE_URL}/links/resolve/${shortUrl}`, {
          credentials: "include",
        });
        const json = await res.json().catch(() => ({}));

        if (cancelled) return;

        if (!res.ok) {
          setState({
            status: "error",
            message: json?.error ?? "This link does not exist or has been deactivated.",
          });
          return;
        }

        const originalUrl: string = json?.data?.originalUrl;
        if (!originalUrl) {
          setState({ status: "error", message: "Could not resolve destination URL." });
          return;
        }

        setState({
          status: "ready",
          originalUrl,
          domain: parseDomain(originalUrl),
        });
      } catch {
        if (!cancelled) {
          setState({ status: "error", message: "Network error. Please try again." });
        }
      }
    }

    resolve();
    return () => { cancelled = true; };
  }, [shortUrl]);

  // ── 2. Start countdown once URL is resolved ───────────────────────────────

  useEffect(() => {
    if (state.status !== "ready") return;

    setCountdown(COUNTDOWN_SECONDS);

    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current!);
  }, [state.status]);

  // ── 3. Redirect when countdown hits 0 ────────────────────────────────────

  useEffect(() => {
    if (countdown === 0 && state.status === "ready") {
      setState({ status: "redirecting", originalUrl: state.originalUrl });
      window.location.href = state.originalUrl;
    }
  }, [countdown, state]);

  // ── Manual redirect ───────────────────────────────────────────────────────

  const handleSkip = () => {
    if (state.status !== "ready") return;
    clearInterval(intervalRef.current!);
    setState({ status: "redirecting", originalUrl: state.originalUrl });
    window.location.href = state.originalUrl;
  };

  // ─────────────────────────────────────────────────────────────────────────

  const isReady = state.status === "ready";
  const isRedirecting = state.status === "redirecting";

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-indigo-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-indigo-900/10 rounded-full blur-3xl" />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-zinc-800/60">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center shadow-md shadow-indigo-500/30">
            <Link2 className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold tracking-tight text-white font-mono">
            snip.ly
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Safe redirect</span>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 gap-10">

        {/* ── Ad slot placeholder ─────────────────────────────────────────── */}
        {/* Replace this div with your ad network script/component */}
        {/* e.g. Google AdSense, Carbon Ads, etc. */}
        {/* ─────────────────────────────────────────────────────────────────── */}

        {/* ── Redirect card ────────────────────────────────────────────────── */}
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/70 backdrop-blur-sm shadow-2xl overflow-hidden">

            {/* Destination info */}
            <div className="px-6 pt-6 pb-5 border-b border-zinc-800/60">
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-3">
                You are being redirected to
              </p>

              {state.status === "loading" ? (
                <LoadingSkeleton />
              ) : state.status === "error" ? (
                <ErrorState message={state.message} />
              ) : (
                <div className="flex items-start gap-3">
                  {/* Favicon */}
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center shrink-0 mt-0.5 overflow-hidden">
                    <img
                      src={`https://www.google.com/s2/favicons?sz=32&domain=${
                        isReady ? state.domain : (state as { originalUrl: string }).originalUrl
                      }`}
                      alt=""
                      className="w-5 h-5"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-semibold text-sm truncate">
                      {isReady ? state.domain : isRedirecting ? (state as { originalUrl: string }).originalUrl : ""}
                    </p>
                    <p className="text-zinc-500 text-xs mt-0.5 break-all line-clamp-2">
                      {isReady
                        ? state.originalUrl
                        : isRedirecting
                        ? (state as { originalUrl: string }).originalUrl
                        : ""}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Countdown + actions */}
            {(isReady || isRedirecting) && (
              <div className="px-6 py-5 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-zinc-300 text-sm font-medium">
                    {isRedirecting
                      ? "Redirecting…"
                      : `Redirecting in ${countdown}s`}
                  </p>
                  <p className="text-zinc-600 text-xs mt-0.5">
                    or{" "}
                    <button
                      onClick={handleSkip}
                      disabled={isRedirecting}
                      className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium disabled:opacity-50"
                    >
                      go now
                    </button>
                  </p>
                </div>

                {isRedirecting ? (
                  <div className="w-10 h-10 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
                ) : (
                  <CountdownRing seconds={countdown} total={COUNTDOWN_SECONDS} />
                )}
              </div>
            )}
          </div>

          {/* Safety note */}
          {isReady && (
            <p className="text-center text-[11px] text-zinc-600 mt-4 leading-relaxed">
              This link was shortened with snip.ly. We checked it is safe to visit.
              <br />
              Always verify the destination before entering personal information.
            </p>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-4 border-t border-zinc-800/60 flex items-center justify-center">
        <p className="text-[11px] text-zinc-700">
          Powered by{" "}
          <span className="text-zinc-500 font-mono font-semibold">snip.ly</span>
          {" · "}
          <a
            href="/dashboard/links"
            className="hover:text-zinc-400 transition-colors"
          >
            Create your own short links
          </a>
        </p>
      </footer>
    </div>
  );
}