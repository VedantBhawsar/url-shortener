import { useNavigate } from "react-router-dom";
import { Zap, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateCheckoutSession } from "@/hooks/useApi";
import { useAuthStore, selectIsAuthenticated } from "@/store/authStore";
import { cn } from "@/lib/utils";

// ─── Feature list for the upgrade card ───────────────────────────────────────

const PREMIUM_FEATURES = [
  "Unlimited short links",
  "Custom expiry dates",
  "Region blocking",
  "Full click analytics",
  "Priority support",
];

interface UpgradePromptProps {
  /** Optional heading override */
  heading?: string;
  /** Optional subheading override */
  description?: string;
  /** Additional wrapper class */
  className?: string;
  /** Show a compact inline variant (no full card) */
  compact?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UpgradePrompt({
  heading = "Upgrade to Premium",
  description = "Unlock unlimited links, custom expiry, region blocking, and full analytics.",
  className,
  compact = false,
}: UpgradePromptProps) {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const checkout = useCreateCheckoutSession();

  const handleUpgrade = () => {
    if (!isAuthenticated) {
      navigate("/register");
      return;
    }
    checkout.mutate();
  };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <p className="text-sm text-muted-foreground flex-1">{description}</p>
        <Button
          size="sm"
          onClick={handleUpgrade}
          disabled={checkout.isPending}
          className="shrink-0 gap-1.5"
        >
          <Zap className="w-3.5 h-3.5" />
          Upgrade
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-primary/30 bg-primary/5 p-5",
        className
      )}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
          <Zap className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{heading}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>

      <ul className="space-y-1.5 mb-4">
        {PREMIUM_FEATURES.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-xs text-foreground/80">
            <Check className="w-3.5 h-3.5 text-primary shrink-0" />
            {feature}
          </li>
        ))}
      </ul>

      <Button
        onClick={handleUpgrade}
        disabled={checkout.isPending}
        className="w-full gap-2"
      >
        <Zap className="w-4 h-4" />
        {checkout.isPending ? "Redirecting…" : "Upgrade for $9/month"}
      </Button>
    </div>
  );
}
