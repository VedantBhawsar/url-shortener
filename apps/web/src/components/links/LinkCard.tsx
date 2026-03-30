import { useState } from "react";
import { ExternalLink, Copy, Trash2, Pencil, ToggleLeft, ToggleRight, BarChart3, Check, Loader2, QrCode } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ShortLink } from "@/hooks/useApi";
import { QRCodeDialog } from "@/components/links/QRCodeDialog";

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
          className="h-7 w-7 text-muted-foreground hover:text-foreground transition-colors"
          onClick={handleCopy}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
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
          className="h-7 w-7 text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => onChange(!status)}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : status ? (
            <ToggleRight className="w-4 h-4 text-success" />
          ) : (
            <ToggleLeft className="w-4 h-4 text-muted-foreground/40" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
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
  const [qrOpen, setQrOpen] = useState(false);

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
        "bg-card/60 border-border/80 hover:border-border hover:bg-card"
      )}
    >
      {/* Favicon + URLs */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-muted border border-border/60 flex items-center justify-center shrink-0 overflow-hidden">
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
              className="text-sm font-semibold text-primary hover:text-primary/80 font-mono transition-colors truncate"
            >
              {link.shortUrl}
            </a>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-1.5 py-0 border font-medium",
                link.status
                  ? "border-success/60 text-success bg-success/10"
                  : "border-border text-muted-foreground bg-muted/40"
              )}
            >
              {link.status ? "Active" : "Inactive"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{link.originalUrl}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground sm:pr-2 shrink-0">
        <BarChart3 className="w-3 h-3" />
        <span className="font-medium text-foreground/70">{link.clicksCount.toLocaleString()}</span>
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
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => setQrOpen(true)}
            >
              <QrCode className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>QR Code</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => window.open(link.originalUrl, "_blank")}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Visit original</TooltipContent>
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
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => onViewAnalytics(link.id)}
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Analytics</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => onEdit(link)}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edit</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              onClick={() => onDelete(link.id)}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete</TooltipContent>
        </Tooltip>
      </div>

      <QRCodeDialog
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        shortUrl={interstitialUrl}
        label={link.shortUrl}
      />
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function LinkCardSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-border/80 bg-card/60 animate-pulse">
      <div className="w-8 h-8 rounded-lg bg-muted" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-32 bg-muted rounded" />
        <div className="h-3 w-64 bg-muted/60 rounded" />
      </div>
      <div className="h-3 w-16 bg-muted/60 rounded" />
    </div>
  );
}
