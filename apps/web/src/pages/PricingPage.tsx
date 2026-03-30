import { useNavigate } from "react-router-dom";
import { Check, Zap, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCreateCheckoutSession, useSubscriptionStatus } from "@/hooks/useApi";
import { useAuthStore, selectIsAuthenticated } from "@/store/authStore";
import { cn } from "@/lib/utils";

// ─── Plan Features ────────────────────────────────────────────────────────────

const FREE_FEATURES = [
  { text: "10 short links", included: true },
  { text: "7-day link expiry (auto)", included: true },
  { text: "Basic click count", included: true },
  { text: "Custom expiry dates", included: false },
  { text: "Region blocking", included: false },
  { text: "Full click analytics", included: false },
];

const PREMIUM_FEATURES = [
  { text: "Unlimited short links", included: true },
  { text: "Custom expiry dates", included: true },
  { text: "Region blocking", included: true },
  { text: "Full click analytics (geo, device)", included: true },
  { text: "Priority support", included: true },
  { text: "All future features", included: true },
];

// ─── Plan Card ────────────────────────────────────────────────────────────────

interface PlanCardProps {
  name: string;
  price: string;
  period: string;
  description: string;
  features: { text: string; included: boolean }[];
  highlighted?: boolean;
  badge?: string;
  cta: React.ReactNode;
}

function PlanCard({
  name,
  price,
  period,
  description,
  features,
  highlighted,
  badge,
  cta,
}: PlanCardProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border p-6",
        highlighted
          ? "border-primary/50 bg-primary/5"
          : "border-border bg-card/50"
      )}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground border-0 px-3 text-xs font-semibold">
            {badge}
          </Badge>
        </div>
      )}
      <div className="mb-5">
        <h3 className="text-base font-semibold text-foreground">{name}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="mb-5">
        <span className="text-3xl font-bold text-foreground">{price}</span>
        {period && (
          <span className="text-sm text-muted-foreground ml-1.5">{period}</span>
        )}
      </div>
      <Separator className="bg-border mb-5" />
      <ul className="space-y-2.5 mb-6 flex-1">
        {features.map(({ text, included }) => (
          <li key={text} className="flex items-start gap-2.5 text-sm">
            <span
              className={cn(
                "w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                included
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground/40"
              )}
            >
              {included ? (
                <Check className="w-2.5 h-2.5" strokeWidth={3} />
              ) : (
                <span className="w-1 h-0.5 rounded bg-current" />
              )}
            </span>
            <span className={included ? "text-foreground/80" : "text-muted-foreground/40"}>
              {text}
            </span>
          </li>
        ))}
      </ul>
      {cta}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function PricingPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const { data: statusRes } = useSubscriptionStatus();
  const checkout = useCreateCheckoutSession();

  const isPremium = statusRes?.data?.planId === "premium";

  const handleUpgrade = () => {
    if (!isAuthenticated) {
      navigate("/register");
      return;
    }
    if (isPremium) {
      navigate("/dashboard/billing");
      return;
    }
    checkout.mutate();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav bar */}
      <header className="border-b border-border/80 px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate("/dashboard/links")}
          className="flex items-center gap-2 text-sm font-semibold text-foreground/80 hover:text-foreground transition-colors"
        >
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Link2 className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          snip.ly
        </button>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard/links")}
              className="text-muted-foreground hover:text-foreground"
            >
              Dashboard
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/login")}
                className="text-muted-foreground hover:text-foreground"
              >
                Sign in
              </Button>
              <Button
                size="sm"
                onClick={() => navigate("/register")}
              >
                Get started
              </Button>
            </>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            Simple pricing
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            Start free. Upgrade when you&apos;re ready.
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            No hidden fees. Cancel anytime. Premium unlocks everything.
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6">
          <PlanCard
            name="Free"
            price="$0"
            period="forever"
            description="Perfect for personal use and testing."
            features={FREE_FEATURES}
            cta={
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(isAuthenticated ? "/dashboard/links" : "/register")}
              >
                {isAuthenticated ? "Current plan" : "Get started free"}
              </Button>
            }
          />
          <PlanCard
            name="Premium"
            price="$9"
            period="/month"
            description="For power users and growing businesses."
            features={PREMIUM_FEATURES}
            highlighted
            badge="Most popular"
            cta={
              <Button
                onClick={handleUpgrade}
                disabled={checkout.isPending}
                className="w-full gap-2"
              >
                <Zap className="w-4 h-4" />
                {checkout.isPending
                  ? "Redirecting…"
                  : isPremium
                    ? "Manage subscription"
                    : "Upgrade to Premium"}
              </Button>
            }
          />
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground/60 mt-8">
          Payments are processed securely by Stripe. You can cancel anytime.
        </p>
      </main>
    </div>
  );
}
