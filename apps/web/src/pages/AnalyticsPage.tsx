import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import {
  ArrowLeft,
  Globe,
  MousePointerClick,
  Clock,
  Monitor,
  Smartphone,
  Tablet,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLinks, useAnalytics, useSubscriptionStatus, ClickEvent } from "@/hooks/useApi";
import { UpgradePrompt } from "@/components/billing/UpgradePrompt";
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
    <div className="flex flex-col gap-1 p-4 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
        {icon}
        {label}
      </div>
      <span className="text-2xl font-bold text-foreground tracking-tight">{value}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  );
}

// ─── Locked Stat Card ─────────────────────────────────────────────────────────

function LockedStatCard({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-1 p-4 rounded-xl bg-card border border-border relative overflow-hidden">
      <div className="flex items-center gap-2 text-muted-foreground/40 text-xs font-medium mb-1">
        <Lock className="w-3.5 h-3.5" />
        {label}
      </div>
      <span className="text-2xl font-bold text-muted-foreground/20 tracking-tight select-none">
        ——
      </span>
      <Badge
        variant="outline"
        className="absolute top-2 right-2 text-[10px] border-primary/30 text-primary bg-primary/5"
      >
        Premium
      </Badge>
    </div>
  );
}

// ─── Breakdown Bar ────────────────────────────────────────────────────────────

interface BreakdownItem {
  label: string;
  count: number;
  total: number;
}

function BreakdownBar({ label, count, total }: BreakdownItem) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 text-xs text-foreground truncate">{label || "Unknown"}</span>
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-right text-xs text-muted-foreground font-mono">{pct}%</span>
      <span className="w-8 text-right text-xs text-muted-foreground font-mono">{count}</span>
    </div>
  );
}

// ─── Breakdown Section ────────────────────────────────────────────────────────

interface BreakdownSectionProps {
  title: string;
  icon: React.ReactNode;
  items: [string, number][];
  total: number;
}

function BreakdownSection({ title, icon, items, total }: BreakdownSectionProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {icon}
        {title}
      </div>
      {items.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          {items.map(([label, count]) => (
            <BreakdownBar key={label} label={label} count={count} total={total} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No data yet</p>
      )}
    </div>
  );
}

// ─── Device Icon ──────────────────────────────────────────────────────────────

function DeviceIcon({ device }: { device: string }) {
  const lower = device.toLowerCase();
  if (lower === "mobile") return <Smartphone className="w-3 h-3" />;
  if (lower === "tablet") return <Tablet className="w-3 h-3" />;
  return <Monitor className="w-3 h-3" />;
}

// ─── Click Row ────────────────────────────────────────────────────────────────

function ClickRow({ click, index }: { click: ClickEvent; index: number }) {
  const date = new Date(click.createdAt);
  const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = date.toLocaleDateString([], { month: "short", day: "numeric" });

  const browser = click.browser || (() => {
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
        "grid grid-cols-[2rem_1fr_auto] sm:grid-cols-[2rem_1fr_100px_80px_120px_100px] items-center gap-3 px-4 py-3 text-sm transition-colors border-b border-border last:border-b-0 hover:bg-muted/50",
        index % 2 === 0 ? "bg-card" : "bg-muted/30"
      )}
    >
      <span className="text-muted-foreground text-xs font-mono">{index + 1}</span>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {click.country ? (
            <span className="text-xs text-foreground font-medium">
              {click.city ? `${click.city}, ${click.country}` : click.country}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Unknown location</span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground truncate">{click.referer || "Direct"}</p>
      </div>
      <span className="hidden sm:block text-xs text-muted-foreground font-mono truncate">{browser}</span>
      <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
        <DeviceIcon device={click.device} />
        {click.device || "—"}
      </span>
      <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="w-3 h-3" />
        {dateStr} {timeStr}
      </span>
      <div className="text-right">
        <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
          {click.ipAddress
            ? click.ipAddress.split(".").slice(0, 2).join(".") + ".x.x"
            : "—"}
        </Badge>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function countBy(clicks: ClickEvent[], key: keyof ClickEvent): [string, number][] {
  const map: Record<string, number> = {};
  for (const c of clicks) {
    const val = String(c[key] || "Unknown");
    map[val] = (map[val] ?? 0) + 1;
  }
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
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
  const { data: statusRes } = useSubscriptionStatus();

  const isPremium = statusRes?.data?.features?.fullAnalytics === true;

  const clicks = data?.data.clicks ?? [];
  const clicksCount = data?.data.clicksCount ?? 0;

  const countryCounts = countBy(clicks, "country");
  const topCountries = countryCounts.slice(0, 5);
  const deviceCounts = countBy(clicks, "device").slice(0, 5);
  const browserCounts = countBy(clicks, "browser").slice(0, 5);
  const osCounts = countBy(clicks, "os").slice(0, 5);

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
          className="w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-muted"
          onClick={() => navigate("/dashboard/links")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight text-foreground">Analytics</h1>
        </div>
        <Select value={selectedId} onValueChange={handleSelectChange}>
          <SelectTrigger className="w-52 bg-background border-border text-foreground text-sm h-9 focus:ring-primary">
            <SelectValue placeholder="Select a link…" />
          </SelectTrigger>
          <SelectContent className="bg-background border-border text-foreground">
            {links.map((l) => (
              <SelectItem
                key={l.id}
                value={l.id}
                className="text-sm font-mono focus:bg-muted focus:text-foreground"
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
            <div key={i} className="h-24 rounded-xl bg-muted border border-border" />
          ))}
        </div>
      ) : (
        <>
          {/* Stats — Total Clicks always visible; rest are Premium */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              icon={<MousePointerClick className="w-3.5 h-3.5" />}
              label="Total clicks"
              value={clicksCount.toLocaleString()}
            />
            {isPremium ? (
              <>
                <StatCard
                  icon={<Globe className="w-3.5 h-3.5" />}
                  label="Countries"
                  value={countryCounts.length}
                />
                <StatCard
                  icon={<Globe className="w-3.5 h-3.5" />}
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
              </>
            ) : (
              <>
                <LockedStatCard label="Countries" />
                <LockedStatCard label="Top country" />
                <LockedStatCard label="Last click" />
              </>
            )}
          </div>

          {/* Premium gate: breakdown + click log */}
          {isPremium ? (
            <>
              {/* Breakdown sections */}
              {clicks.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <BreakdownSection
                    title="Device"
                    icon={<Monitor className="w-3.5 h-3.5" />}
                    items={deviceCounts}
                    total={clicks.length}
                  />
                  <BreakdownSection
                    title="Browser"
                    icon={<Globe className="w-3.5 h-3.5" />}
                    items={browserCounts}
                    total={clicks.length}
                  />
                  <BreakdownSection
                    title="Operating System"
                    icon={<Smartphone className="w-3.5 h-3.5" />}
                    items={osCounts}
                    total={clicks.length}
                  />
                </div>
              )}

              {/* Click log */}
              {clicks.length > 0 ? (
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="hidden sm:grid grid-cols-[2rem_1fr_100px_80px_120px_100px] gap-3 px-4 py-3 bg-muted text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border sticky top-0">
                    <span>#</span>
                    <span>Location / Referrer</span>
                    <span>Browser</span>
                    <span>Device</span>
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
                  <MousePointerClick className="w-8 h-8 text-muted-foreground mb-3" />
                  <p className="text-foreground font-medium text-sm">No clicks yet</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Share your link to start tracking
                  </p>
                </div>
              )}
            </>
          ) : (
            /* Free plan — upgrade prompt in place of premium sections */
            <UpgradePrompt
              heading="Unlock full analytics"
              description="See device breakdowns, browser stats, OS distribution, geo-location, referrer data, and a full click-by-click log with Premium."
              className="mt-2"
            />
          )}
        </>
      )}
    </div>
  );
}
