"use client";

import { useState, useEffect, useCallback } from "react";
import type { Subscription } from "@/lib/supabase/types";
import type { PlanTier } from "@/lib/stripe/config";
import { getLimits, hasFeature, isWithinLimit, type GatedFeature } from "@/lib/stripe/features";
import type { PlanLimits } from "@/lib/stripe/config";

interface UseSubscriptionReturn {
  subscription: Subscription | null;
  tier: PlanTier;
  loading: boolean;
  canAccess: (feature: GatedFeature) => boolean;
  withinLimit: (feature: keyof PlanLimits, count: number) => boolean;
  limits: PlanLimits;
  isPro: boolean;
  isElite: boolean;
  isFree: boolean;
  refresh: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    try {
      const res = await fetch("/api/stripe/subscription");
      if (res.ok) {
        const data = await res.json();
        setSubscription(data);
      }
    } catch {
      // Default to free on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const tier = (subscription?.plan_tier || "free") as PlanTier;

  return {
    subscription,
    tier,
    loading,
    canAccess: (feature: GatedFeature) => hasFeature(tier, feature),
    withinLimit: (feature: keyof PlanLimits, count: number) =>
      isWithinLimit(tier, feature, count),
    limits: getLimits(tier),
    isPro: tier === "pro" || tier === "elite",
    isElite: tier === "elite",
    isFree: tier === "free",
    refresh: fetchSubscription,
  };
}
