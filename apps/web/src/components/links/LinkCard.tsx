import { useState } from "react";
import { ExternalLink, Copy, Trash2, Pencil, ToggleLeft, ToggleRight, BarChart3, Check, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ShortLink } from "@/hooks/useApi";

// The shareable URL goes through the frontend interstitial at /go/:shortUrl
// so users see the redirect page (with future ad support) before landing.
const FRONTEND_BASE =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.host}`
    : "";

// ─── Copy Button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700/60 transition-colors"
          onClick={handleCopy}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent className="bg-zinc-800 border-zinc-700 text-zinc-200">
        {copied ? "Copied!" : "Copy link"}
      </TooltipContent>
    </Tooltip>
  );
}

// ─── Status Toggle ────────────────────────────────────────────────────────────

interface StatusToggleProps {
  status: boolean;
  loading?: boolean;
  onChange: (v: boolean) => void;
}

function StatusToggle({ status, loading, onChange }: StatusToggleProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700/60 transition-colors"
          onClick={() => onChange(!status)}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : status ? (
            <ToggleRight className="w-4 h-4 text-emerald-400" />
          ) : (
            <ToggleLeft className="w-4 h-4 text-zinc-600" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent className="bg-zinc-800 border-zinc-700 text-zinc-200">
        {status ? "Deactivate link" : "Activate link"}
      </TooltipContent>
    </Tooltip>
  );
}

// ─── Link Card ────────────────────────────────────────────────────────────────

interface LinkCardProps {
  link: ShortLink;
  onEdit: (link: ShortLink) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, status: boolean) => void;
  onViewAnalytics: (id: string) => void;
  isDeleting?: boolean;
  isUpdating?: boolean;
}

export function LinkCard({
  link,
  onEdit,
  onDelete,
  onToggleStatus,
  onViewAnalytics,
  isDeleting,
  isUpdating,
}: LinkCardProps) {
  // This is the shareable URL — points to the frontend interstitial
  const interstitialUrl = `${FRONTEND_BASE}/go/${link.shortUrl}`;
  const domain = (() => {
    try { return new URL(link.originalUrl).hostname; }
    catch { return link.originalUrl; }
  })();

  return (
    <div
      className={cn(
        "group relative flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3.5 rounded-xl border transition-all duration-150",
        "bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900"
      )}
    >
      {/* Favicon + URLs */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center shrink-0 overflow-hidden">
          <img
            src={`https://www.google.com/s2/favicons?sz=32&domain=${domain}`}
            alt=""
            className="w-4 h-4"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={interstitialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 font-mono transition-colors truncate"
            >
              {link.shortUrl}
            </a>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-1.5 py-0 border font-medium",
                link.status
                  ? "border-emerald-700/60 text-emerald-400 bg-emerald-500/10"
                  : "border-zinc-700 text-zinc-500 bg-zinc-800/40"
              )}
            >
              {link.status ? "Active" : "Inactive"}
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 truncate mt-0.5">{link.originalUrl}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-1 text-xs text-zinc-500 sm:pr-2 shrink-0">
        <BarChart3 className="w-3 h-3" />
        <span className="font-medium text-zinc-400">{link.clicksCount.toLocaleString()}</span>
        <span>clicks</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 shrink-0">
        <CopyButton text={interstitialUrl} />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700/60"
              onClick={() => window.open(link.originalUrl, "_blank")}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-zinc-800 border-zinc-700 text-zinc-200">Visit original</TooltipContent>
        </Tooltip>
        <StatusToggle
          status={link.status}
          loading={isUpdating}
          onChange={(v) => onToggleStatus(link.id, v)}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700/60"
              onClick={() => onViewAnalytics(link.id)}
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-zinc-800 border-zinc-700 text-zinc-200">Analytics</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700/60"
              onClick={() => onEdit(link)}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-zinc-800 border-zinc-700 text-zinc-200">Edit</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              onClick={() => onDelete(link.id)}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-zinc-800 border-zinc-700 text-zinc-200">Delete</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function LinkCardSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 animate-pulse">
      <div className="w-8 h-8 rounded-lg bg-zinc-800" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-32 bg-zinc-800 rounded" />
        <div className="h-3 w-64 bg-zinc-800/60 rounded" />
      </div>
      <div className="h-3 w-16 bg-zinc-800/60 rounded" />
    </div>
  );
}