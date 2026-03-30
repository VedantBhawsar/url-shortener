import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Loader2, AlertCircle, Wand2, Lock, X } from "lucide-react";
import {
  useCreateLink,
  useUpdateLink,
  useSubscriptionStatus,
  ShortLink,
} from "@/hooks/useApi";

// ─── Country codes (ISO 3166-1 alpha-2) ──────────────────────────────────────

const COMMON_COUNTRIES: { code: string; name: string }[] = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IN", name: "India" },
  { code: "CN", name: "China" },
  { code: "RU", name: "Russia" },
  { code: "BR", name: "Brazil" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "MX", name: "Mexico" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
];

// ─── Blocked Regions Input ────────────────────────────────────────────────────

interface RegionsInputProps {
  value: string[];
  onChange: (v: string[]) => void;
  disabled?: boolean;
}

function RegionsInput({ value, onChange, disabled }: RegionsInputProps) {
  const [input, setInput] = useState("");

  const add = (code: string) => {
    const upper = code.toUpperCase().trim();
    if (upper.length === 2 && !value.includes(upper)) {
      onChange([...value, upper]);
    }
    setInput("");
  };

  const remove = (code: string) => {
    onChange(value.filter((c) => c !== code));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      e.preventDefault();
      add(input.trim());
    }
    if (e.key === "Backspace" && !input && value.length > 0) {
      remove(value[value.length - 1]);
    }
  };

  return (
    <div className="space-y-2">
      {/* Tag list */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((code) => (
            <Badge
              key={code}
              variant="secondary"
              className="gap-1 pr-1 font-mono text-xs"
            >
              {code}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => remove(code)}
                  className="hover:text-destructive transition-colors ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Text input */}
      <Input
        placeholder="Type 2-letter code + Enter (e.g. US)"
        value={input}
        onChange={(e) => setInput(e.target.value.toUpperCase().slice(0, 2))}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        maxLength={2}
        className="h-10 font-mono uppercase"
      />

      {/* Common country quick-add */}
      {!disabled && (
        <div className="flex flex-wrap gap-1">
          {COMMON_COUNTRIES.filter((c) => !value.includes(c.code)).map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => add(c.code)}
              className="text-[11px] text-muted-foreground hover:text-foreground border border-border hover:border-border/80 rounded px-1.5 py-0.5 transition-colors font-mono"
            >
              {c.code}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Premium field wrapper ────────────────────────────────────────────────────

function PremiumField({
  label,
  isPremium,
  children,
}: {
  label: string;
  isPremium: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium text-foreground">{label}</Label>
        {!isPremium && (
          <Badge
            variant="outline"
            className="border-primary/40 text-primary text-[10px] gap-1 py-0 px-1.5"
          >
            <Lock className="w-2.5 h-2.5" />
            Premium
          </Badge>
        )}
      </div>
      {isPremium ? (
        children
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-not-allowed">{children}</div>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="max-w-[200px] text-center"
          >
            Upgrade to Premium to use this feature.
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

// ─── Dialog ───────────────────────────────────────────────────────────────────

interface LinkDialogProps {
  open: boolean;
  onClose: () => void;
  editTarget?: ShortLink | null;
}

export function LinkDialog({ open, onClose, editTarget }: LinkDialogProps) {
  const isEdit = !!editTarget;

  const { data: subRes } = useSubscriptionStatus();
  const isPremium = subRes?.data?.planId === "premium";

  const [originalUrl, setOriginalUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState<Date | undefined>(undefined);
  const [blockedRegions, setBlockedRegions] = useState<string[]>([]);

  const create = useCreateLink();
  const update = useUpdateLink(editTarget?.id ?? "");

  const isPending = create.isPending || update.isPending;
  const error = create.error || update.error;

  useEffect(() => {
    if (open) {
      setOriginalUrl(editTarget?.originalUrl ?? "");
      setShortUrl(editTarget?.shortUrl ?? "");
      setExpiresAt(
        editTarget?.expiresAt ? new Date(editTarget.expiresAt) : undefined
      );
      setBlockedRegions(editTarget?.blockedRegions ?? []);
      create.reset();
      update.reset();
    }
  }, [open, editTarget]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      originalUrl,
      shortUrl: shortUrl || undefined,
      expiresAt: isPremium && expiresAt ? expiresAt.toISOString() : undefined,
      blockedRegions: isPremium ? blockedRegions : undefined,
    };

    if (isEdit) {
      update.mutate(
        {
          originalUrl,
          shortUrl,
          expiresAt: isPremium && expiresAt ? expiresAt.toISOString() : null,
          blockedRegions: isPremium ? blockedRegions : undefined,
        },
        { onSuccess: onClose }
      );
    } else {
      create.mutate(payload, { onSuccess: onClose });
    }
  };

  // Minimum date: start of today (calendar disables past dates)
  const minDate = new Date();
  minDate.setHours(0, 0, 0, 0);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold tracking-tight">
            {isEdit ? "Edit short link" : "Create short link"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {error && (
            <Alert className="bg-destructive/10 border-destructive/30 text-destructive py-2.5">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {(error as Error).message}
              </AlertDescription>
            </Alert>
          )}

          {/* Destination URL */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">
              Destination URL <span className="text-destructive">*</span>
            </Label>
            <Input
              type="url"
              placeholder="https://example.com/very/long/url"
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
              disabled={isPending}
              required
              className="h-10"
            />
          </div>

          {/* Custom slug */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-foreground">
                Custom slug
              </Label>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Wand2 className="w-3 h-3" />
                Auto-generated if blank
              </span>
            </div>
            <div className="flex">
              <span className="flex items-center px-3 text-xs text-muted-foreground bg-muted border border-r-0 border-border rounded-l-md font-mono">
                snip.ly/
              </span>
              <Input
                placeholder="my-link"
                value={shortUrl}
                onChange={(e) =>
                  setShortUrl(e.target.value.replace(/\s/g, "-").toLowerCase())
                }
                disabled={isPending}
                className="rounded-l-none h-10 font-mono"
              />
            </div>
          </div>

          {/* Expiry date — Premium only */}
          <PremiumField label="Expiry date" isPremium={isPremium}>
            <DateTimePicker
              value={expiresAt}
              onChange={setExpiresAt}
              minDate={minDate}
              disabled={isPending || !isPremium}
              placeholder="Pick expiry date & time"
            />
          </PremiumField>

          {/* Blocked regions — Premium only */}
          <PremiumField label="Block regions" isPremium={isPremium}>
            <RegionsInput
              value={blockedRegions}
              onChange={setBlockedRegions}
              disabled={isPending || !isPremium}
            />
          </PremiumField>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isPending}
              className="text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !originalUrl}
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : null}
              {isEdit ? "Save changes" : "Create link"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
