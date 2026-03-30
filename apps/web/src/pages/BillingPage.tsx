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
      <Badge className="bg-indigo-500/15 text-indigo-400 border-indigo-500/30 gap-1">
        <Zap className="w-3 h-3" />
        Premium
      </Badge>
    );
  }
  return (
    <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700">
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
      <p className="text-sm text-zinc-400">
        <span className="text-white font-semibold">{linksUsed}</span> links created
        &nbsp;&mdash;&nbsp;
        <span className="text-indigo-400">unlimited</span>
      </p>
    );
  }

  const isWarning = percentage >= 80 && percentage < 100;
  const isLimit = percentage >= 100;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-400">Links used</span>
        <span
          className={
            isLimit
              ? "text-red-400 font-semibold"
              : isWarning
                ? "text-amber-400 font-semibold"
                : "text-zinc-300"
          }
        >
          {linksUsed} / {linksLimit}
        </span>
      </div>
      <Progress
        value={Math.min(percentage, 100)}
        className="h-1.5 bg-zinc-800"
      />
      {isWarning && (
        <p className="text-xs text-amber-400 flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3" />
          You&apos;re approaching your link limit.
        </p>
      )}
      {isLimit && (
        <p className="text-xs text-red-400 flex items-center gap-1.5">
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
        <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
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
        <h1 className="text-xl font-bold tracking-tight text-white">Billing</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Manage your subscription and usage
        </p>
      </div>

      {/* Past-due warning */}
      {isPastDue && (
        <Alert className="bg-red-950/40 border-red-800/60 text-red-300">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Your last payment failed. Please update your payment method in Stripe to avoid
            losing access to Premium features.
          </AlertDescription>
        </Alert>
      )}

      {/* Canceling notice */}
      {isCanceling && status?.currentPeriodEnd && (
        <Alert className="bg-amber-950/40 border-amber-700/40 text-amber-300">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Your subscription will downgrade to Free on{" "}
            <strong>{format(new Date(status.currentPeriodEnd), "MMMM d, yyyy")}</strong>.
            Your existing links will not be deleted.
          </AlertDescription>
        </Alert>
      )}

      {/* Current plan card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-4 h-4 text-zinc-400" />
            <span className="text-sm font-medium text-zinc-200">Current plan</span>
          </div>
          <PlanBadge planId={status?.planId ?? "free"} />
        </div>

        <Separator className="bg-zinc-800" />

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
            <div key={label} className="text-center p-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
              {value ? (
                <CheckCircle2 className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
              ) : (
                <XCircle className="w-4 h-4 text-zinc-600 mx-auto mb-1" />
              )}
              <span className="text-[11px] text-zinc-500">{label}</span>
            </div>
          ))}
        </div>

        {/* Period info for premium */}
        {isPremium && status?.currentPeriodEnd && (
          <p className="text-xs text-zinc-500">
            {isCanceling ? "Access until" : "Renews on"}{" "}
            <span className="text-zinc-300">
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
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h3 className="text-sm font-medium text-zinc-200 mb-1">
            Cancel subscription
          </h3>
          <p className="text-xs text-zinc-500 mb-4">
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
            className="border-red-800/50 text-red-400 hover:bg-red-950/30 hover:text-red-300"
          >
            {cancel.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
            ) : null}
            Cancel plan
          </Button>
        </div>
      )}

      {/* View pricing link */}
      <p className="text-xs text-zinc-600">
        View{" "}
        <button
          onClick={() => navigate("/pricing")}
          className="text-zinc-500 hover:text-zinc-300 underline underline-offset-2"
        >
          full plan comparison
        </button>
        . Payments processed by Stripe.
      </p>
    </div>
  );
}
