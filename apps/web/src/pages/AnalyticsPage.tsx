import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Globe, MousePointerClick, Smartphone, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLinks, useAnalytics, ClickEvent } from "@/hooks/useApi";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
}

function StatCard({ icon, label, value, sub }: StatCardProps) {
  return (
    <div className="flex flex-col gap-1 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
      <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium mb-1">
        {icon}
        {label}
      </div>
      <span className="text-2xl font-bold text-white tracking-tight">{value}</span>
      {sub && <span className="text-xs text-zinc-500">{sub}</span>}
    </div>
  );
}

// ─── Click Row ────────────────────────────────────────────────────────────────

function ClickRow({ click, index }: { click: ClickEvent; index: number }) {
  const date = new Date(click.createdAt);
  const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = date.toLocaleDateString([], { month: "short", day: "numeric" });

  const browser = (() => {
    const ua = click.userAgent ?? "";
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Safari")) return "Safari";
    if (ua.includes("Edge")) return "Edge";
    return "Other";
  })();

  return (
    <div
      className={cn(
        "grid grid-cols-[2rem_1fr_auto] sm:grid-cols-[2rem_1fr_120px_120px_100px] items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors",
        index % 2 === 0 ? "bg-transparent" : "bg-zinc-900/40"
      )}
    >
      <span className="text-zinc-600 text-xs font-mono">{index + 1}</span>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {click.country ? (
            <span className="text-xs text-zinc-300 font-medium">
              {click.city ? `${click.city}, ${click.country}` : click.country}
            </span>
          ) : (
            <span className="text-xs text-zinc-600">Unknown location</span>
          )}
        </div>
        <p className="text-[11px] text-zinc-600 truncate">{click.referer || "Direct"}</p>
      </div>
      <span className="hidden sm:block text-xs text-zinc-500 font-mono truncate">{browser}</span>
      <span className="hidden sm:flex items-center gap-1 text-xs text-zinc-500">
        <Clock className="w-3 h-3" />
        {dateStr} {timeStr}
      </span>
      <div className="text-right">
        <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-500">
          {click.ipAddress
            ? click.ipAddress.split(".").slice(0, 2).join(".") + ".x.x"
            : "—"}
        </Badge>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function AnalyticsPage() {
  const { linkId } = useParams<{ linkId?: string }>();
  const navigate = useNavigate();

  const { data: linksData } = useLinks();
  const links = linksData?.data ?? [];

  // When no :linkId in URL and links are loaded, redirect to the first link
  useEffect(() => {
    if (!linkId && links.length > 0) {
      navigate(`/dashboard/analytics/${links[0].id}`, { replace: true });
    }
  }, [linkId, links, navigate]);

  const selectedId = linkId ?? "";
  const { data, isLoading } = useAnalytics(selectedId);

  const clicks = data?.data.clicks ?? [];
  const clicksCount = data?.data.clicksCount ?? 0;

  const countryCounts = clicks.reduce<Record<string, number>>((acc, c) => {
    const key = c.country || "Unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const topCountries = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  /** Changing the select updates the URL — single source of truth */
  const handleSelectChange = (id: string) => {
    navigate(`/dashboard/analytics/${id}`);
  };

  return (
    <div className="flex flex-col h-full gap-5">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
          onClick={() => navigate("/dashboard/links")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight text-white">Analytics</h1>
        </div>
        <Select value={selectedId} onValueChange={handleSelectChange}>
          <SelectTrigger className="w-52 bg-zinc-900 border-zinc-800 text-zinc-200 text-sm h-9 focus:ring-indigo-500">
            <SelectValue placeholder="Select a link…" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
            {links.map((l) => (
              <SelectItem
                key={l.id}
                value={l.id}
                className="text-sm font-mono focus:bg-zinc-800 focus:text-zinc-100"
              >
                /{l.shortUrl}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-zinc-900 border border-zinc-800" />
          ))}
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              icon={<MousePointerClick className="w-3.5 h-3.5" />}
              label="Total clicks"
              value={clicksCount.toLocaleString()}
            />
            <StatCard
              icon={<Globe className="w-3.5 h-3.5" />}
              label="Countries"
              value={Object.keys(countryCounts).length}
            />
            <StatCard
              icon={<Smartphone className="w-3.5 h-3.5" />}
              label="Top country"
              value={topCountries[0]?.[0] ?? "—"}
              sub={topCountries[0] ? `${topCountries[0][1]} clicks` : undefined}
            />
            <StatCard
              icon={<Clock className="w-3.5 h-3.5" />}
              label="Last click"
              value={
                clicks[0]
                  ? new Date(clicks[0].createdAt).toLocaleDateString()
                  : "—"
              }
            />
          </div>

          {/* Click log */}
          {clicks.length > 0 ? (
            <div className="rounded-xl border border-zinc-800/80 overflow-hidden">
              <div className="hidden sm:grid grid-cols-[2rem_1fr_120px_120px_100px] gap-3 px-4 py-2.5 bg-zinc-800/60 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
                <span>#</span>
                <span>Location / Referrer</span>
                <span>Browser</span>
                <span>Time</span>
                <span className="text-right">IP</span>
              </div>
              <div className="max-h-[420px] overflow-y-auto">
                {clicks.map((click, i) => (
                  <ClickRow key={click.id} click={click} index={i} />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <MousePointerClick className="w-8 h-8 text-zinc-700 mb-3" />
              <p className="text-zinc-400 font-medium text-sm">No clicks yet</p>
              <p className="text-zinc-600 text-xs mt-1">
                Share your link to start tracking
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}