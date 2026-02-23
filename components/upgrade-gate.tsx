"use client";

import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/lib/hooks/use-subscription";
import { getRequiredTier, type GatedFeature } from "@/lib/stripe/features";
import { getPlanByTier } from "@/lib/stripe/config";

interface UpgradeGateProps {
  feature: GatedFeature;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function UpgradeGate({ feature, children, fallback }: UpgradeGateProps) {
  const { canAccess, loading } = useSubscription();

  if (loading) return <>{children}</>;
  if (canAccess(feature)) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  const requiredTier = getRequiredTier(feature);
  const plan = getPlanByTier(requiredTier);

  return (
    <div className="relative">
      <div className="pointer-events-none opacity-30 blur-[1px] select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl max-w-sm text-center">
          <div className="w-12 h-12 rounded-xl bg-ember/10 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6 text-ember" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">
            {plan.name} Feature
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Upgrade to {plan.name} to unlock this feature.
          </p>
          <Link href="/pricing">
            <Button className="bg-ember hover:bg-ember/90 text-white rounded-xl">
              <Sparkles className="w-4 h-4 mr-2" />
              Upgrade to {plan.name}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Inline badge for nav items or small UI elements
export function ProBadge() {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-ember/10 text-ember">
      Pro
    </span>
  );
}

export function EliteBadge() {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-gradient-to-r from-ember/10 to-amber-500/10 text-amber-600">
      Elite
    </span>
  );
}
