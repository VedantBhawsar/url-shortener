import { useState } from "react";
import { ExternalLink, Copy, Trash2, Pencil, ToggleLeft, ToggleRight, BarChart3, Check, Loader2, QrCode, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ShortLink } from "@/hooks/useApi";
import { QRCodeDialog } from "@/components/links/QRCodeDialog";
import { formatDistanceToNow } from "date-fns";

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

// ─── Share Sheet ──────────────────────────────────────────────────────────────

interface ShareSheetProps {
  open: boolean;
  onClose: () => void;
  shortUrl: string;
  shareText: string;
}

function ShareSheet({ open, onClose, shortUrl, shareText }: ShareSheetProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const shareOptions = [
    {
      name: "Copy Link",
      action: handleCopy,
      icon: copied ? <Check className="w-5 h-5 text-success" /> : <Copy className="w-5 h-5" />,
    },
    {
      name: "Twitter",
      action: () => {
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shortUrl)}`,
          "_blank"
        );
      },
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M23.953 4.57a10 10 0 002.856-3.915a9.958 9.958 0 01-2.8.856a4.958 4.958 0 002.165-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827a4.996 4.996 0 01-2.212.085a4.936 4.936 0 004.604 3.417a9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>,
    },
    {
      name: "Facebook",
      action: () => {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shortUrl)}`,
          "_blank"
        );
      },
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>,
    },
    {
      name: "LinkedIn",
      action: () => {
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shortUrl)}`,
          "_blank"
        );
      },
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.475-2.236-1.986-2.236-1.081 0-1.722.722-2.004 1.418-.103.249-.129.597-.129.946v5.441h-3.554s.05-8.807 0-9.726h3.554v1.375c.427-.659 1.191-1.594 2.897-1.594 2.117 0 3.704 1.385 3.704 4.362v5.583zM5.337 8.855c-1.144 0-1.915-.762-1.915-1.715 0-.955.77-1.715 1.959-1.715 1.188 0 1.914.76 1.939 1.715 0 .953-.751 1.715-1.983 1.715zm1.946 11.597H3.392V9.142h3.891v11.31zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" /></svg>,
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="w-full rounded-t-xl">
        <SheetHeader className="mb-6">
          <SheetTitle>Share Link</SheetTitle>
          <SheetDescription>
            Share your shortened URL across social media or copy it
          </SheetDescription>
        </SheetHeader>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {shareOptions.map((option) => (
            <button
              key={option.name}
              onClick={option.action}
              className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border/60 hover:border-border hover:bg-card/60 transition-all"
            >
              <div className="text-muted-foreground">{option.icon}</div>
              <span className="text-xs font-medium text-center">{option.name}</span>
            </button>
          ))}
        </div>
        <div className="mt-6 p-3 rounded-lg bg-muted/30 border border-border/60">
          <p className="text-xs text-muted-foreground mb-2">Link URL:</p>
          <p className="text-sm font-mono text-foreground break-all">{shortUrl}</p>
        </div>
      </SheetContent>
    </Sheet>
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
  const [shareOpen, setShareOpen] = useState(false);

  // This is the shareable URL — points to the frontend interstitial
  const interstitialUrl = `${FRONTEND_BASE}/go/${link.shortUrl}`;
  const domain = (() => {
    try { return new URL(link.originalUrl).hostname; }
    catch { return link.originalUrl; }
  })();

  // Calculate expiry countdown
  const expiryCountdown = link.expiresAt ? formatDistanceToNow(new Date(link.expiresAt), { addSuffix: true }) : null;
  const isExpiringSoon = link.expiresAt ? new Date(link.expiresAt).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000 : false;

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
            {expiryCountdown && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-1.5 py-0 border font-medium",
                  isExpiringSoon
                    ? "border-yellow-600/60 text-yellow-700 bg-yellow-50 dark:text-yellow-500 dark:border-yellow-500/60 dark:bg-yellow-950/20"
                    : "border-border text-muted-foreground bg-muted/40"
                )}
              >
                Expires {expiryCountdown}
              </Badge>
            )}
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
              onClick={() => setShareOpen(true)}
            >
              <Share2 className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Share</TooltipContent>
        </Tooltip>
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

      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        shortUrl={interstitialUrl}
        shareText={`Check out this link: ${link.shortUrl}`}
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
