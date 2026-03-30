import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  CreditCard,
  Zap,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UpgradePrompt } from "@/components/billing/UpgradePrompt";
import {
  useSubscriptionStatus,
  useCreateCheckoutSession,
  useCancelSubscription,
} from "@/hooks/useApi";

// ─── Plan badge ───────────────────────────────────────────────────────────────

function PlanBadge({ planId }: { planId: string }) {
  if (planId === "premium") {
    return (
      <Badge className="bg-primary/15 text-primary border-primary/30 gap-1">
        <Zap className="w-3 h-3" />
        Premium
      </Badge>
    );
  }
  return (
    <Badge className="bg-muted text-muted-foreground border-border">
      Free
    </Badge>
  );
}

// ─── Usage Bar ────────────────────────────────────────────────────────────────

function UsageBar({
  linksUsed,
  linksLimit,
  percentage,
}: {
  linksUsed: number;
  linksLimit: number;
  percentage: number;
}) {
  if (linksLimit === -1) {
    return (
      <p className="text-sm text-muted-foreground">
        <span className="text-foreground font-semibold">{linksUsed}</span> links created
        &nbsp;&mdash;&nbsp;
        <span className="text-primary">unlimited</span>
      </p>
    );
  }

  const isWarning = percentage >= 80 && percentage < 100;
  const isLimit = percentage >= 100;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Links used</span>
        <span
          className={
            isLimit
              ? "text-destructive font-semibold"
              : isWarning
                ? "text-warning font-semibold"
                : "text-foreground"
          }
        >
          {linksUsed} / {linksLimit}
        </span>
      </div>
      <Progress
        value={Math.min(percentage, 100)}
        className="h-1.5 bg-muted"
      />
      {isWarning && (
        <p className="text-xs text-warning flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3" />
          You&apos;re approaching your link limit.
        </p>
      )}
      {isLimit && (
        <p className="text-xs text-destructive flex items-center gap-1.5">
          <XCircle className="w-3 h-3" />
          Link limit reached. Upgrade to create more.
        </p>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function BillingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { data: statusRes, isLoading, refetch } = useSubscriptionStatus();
  const checkout = useCreateCheckoutSession();
  const cancel = useCancelSubscription();

  const status = statusRes?.data;

  // Handle return from Stripe Checkout
  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const canceled = searchParams.get("canceled");

    if (sessionId) {
      toast.success("Payment successful! Your plan has been upgraded.", {
        duration: 6000,
      });
      refetch();
      // Clean up URL
      navigate("/dashboard/billing", { replace: true });
    } else if (canceled) {
      toast.info("Checkout was canceled. No charge was made.");
      navigate("/dashboard/billing", { replace: true });
    }
  }, [searchParams, navigate, refetch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
      </div>
    );
  }

  const isPremium = status?.planId === "premium";
  const isPastDue = status?.status === "PAST_DUE";
  const isCanceling = status?.cancelAtPeriodEnd;

  return (
    <div className="max-w-xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Billing</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your subscription and usage
        </p>
      </div>

      {/* Past-due warning */}
      {isPastDue && (
        <Alert className="bg-destructive/10 border-destructive/30 text-destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Your last payment failed. Please update your payment method in Stripe to avoid
            losing access to Premium features.
          </AlertDescription>
        </Alert>
      )}

      {/* Canceling notice */}
      {isCanceling && status?.currentPeriodEnd && (
        <Alert className="bg-warning/10 border-warning/30 text-warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Your subscription will downgrade to Free on{" "}
            <strong>{format(new Date(status.currentPeriodEnd), "MMMM d, yyyy")}</strong>.
            Your existing links will not be deleted.
          </AlertDescription>
        </Alert>
      )}

      {/* Current plan card */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Current plan</span>
          </div>
          <PlanBadge planId={status?.planId ?? "free"} />
        </div>

        <Separator className="bg-border" />

        {/* Usage */}
        {status && (
          <UsageBar
            linksUsed={status.usage.linksUsed}
            linksLimit={status.usage.linksLimit}
            percentage={status.usage.percentage}
          />
        )}

        {/* Features */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Custom expiry", value: status?.features.customExpiry },
            { label: "Region blocking", value: status?.features.regionBlocking },
            { label: "Full analytics", value: status?.features.fullAnalytics },
          ].map(({ label, value }) => (
            <div key={label} className="text-center p-2 rounded-lg bg-muted/50 border border-border/50">
              {value ? (
                <CheckCircle2 className="w-4 h-4 text-primary mx-auto mb-1" />
              ) : (
                <XCircle className="w-4 h-4 text-muted-foreground/40 mx-auto mb-1" />
              )}
              <span className="text-[11px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        {/* Period info for premium */}
        {isPremium && status?.currentPeriodEnd && (
          <p className="text-xs text-muted-foreground">
            {isCanceling ? "Access until" : "Renews on"}{" "}
            <span className="text-foreground">
              {format(new Date(status.currentPeriodEnd), "MMMM d, yyyy")}
            </span>
          </p>
        )}
      </div>

      {/* Upgrade card — only for free users */}
      {!isPremium && (
        <UpgradePrompt
          heading="Upgrade to Premium — $9/month"
          description="Unlimited links, custom expiry, region blocking, and full analytics."
        />
      )}

      {/* Cancel button — only for active premium, not already canceling */}
      {isPremium && !isCanceling && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-medium text-foreground mb-1">
            Cancel subscription
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            You&apos;ll keep Premium access until the end of your billing period. Your links
            won&apos;t be deleted.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              cancel.mutate(undefined, {
                onSuccess: () =>
                  toast.success("Subscription will be canceled at period end"),
                onError: () => toast.error("Failed to cancel subscription"),
              })
            }
            disabled={cancel.isPending}
            className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            {cancel.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
            ) : null}
            Cancel plan
          </Button>
        </div>
      )}

      {/* View pricing link */}
      <p className="text-xs text-muted-foreground/60">
        View{" "}
        <button
          onClick={() => navigate("/pricing")}
          className="text-muted-foreground hover:text-foreground underline underline-offset-2"
        >
          full plan comparison
        </button>
        . Payments processed by Stripe.
      </p>
    </div>
  );
}
