import { PLAN_LIMITS, type PlanTier, type PlanLimits } from "./config";

export function getLimits(tier: PlanTier): PlanLimits {
  return PLAN_LIMITS[tier] || PLAN_LIMITS.free;
}

export function canAccessFeature(
  tier: PlanTier,
  feature: keyof PlanLimits
): boolean {
  const limits = getLimits(tier);
  const value = limits[feature];
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  return false;
}

export function getLimit(tier: PlanTier, feature: keyof PlanLimits): number {
  const limits = getLimits(tier);
  const value = limits[feature];
  if (typeof value === "number") return value;
  return value ? 1 : 0;
}

export function isWithinLimit(
  tier: PlanTier,
  feature: keyof PlanLimits,
  currentCount: number
): boolean {
  const limit = getLimit(tier, feature);
  if (limit === -1) return true; // unlimited
  return currentCount < limit;
}

export type GatedFeature =
  | "voice"
  | "touchpoints"
  | "weekly_review"
  | "insights"
  | "huddle"
  | "export"
  | "custom_personality"
  | "priority_responses";

const FEATURE_MAP: Record<GatedFeature, keyof PlanLimits> = {
  voice: "voiceEnabled",
  touchpoints: "touchpointsEnabled",
  weekly_review: "weeklyReviewEnabled",
  insights: "insightsEnabled",
  huddle: "huddleEnabled",
  export: "exportEnabled",
  custom_personality: "customPersonality",
  priority_responses: "priorityResponses",
};

export function hasFeature(tier: PlanTier, feature: GatedFeature): boolean {
  return canAccessFeature(tier, FEATURE_MAP[feature]);
}

export function getRequiredTier(feature: GatedFeature): PlanTier {
  if (canAccessFeature("free", FEATURE_MAP[feature])) return "free";
  if (canAccessFeature("pro", FEATURE_MAP[feature])) return "pro";
  return "elite";
}
