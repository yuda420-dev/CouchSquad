// Pricing tiers and feature definitions for CoachSquad

export type PlanTier = "free" | "pro" | "elite";

export interface PlanConfig {
  name: string;
  tier: PlanTier;
  price: number; // monthly in dollars
  priceId: string | null; // Stripe price ID
  description: string;
  features: string[];
  limits: PlanLimits;
  highlight?: boolean; // show as recommended
}

export interface PlanLimits {
  maxCoaches: number;
  maxMessagesPerDay: number;
  voiceEnabled: boolean;
  touchpointsEnabled: boolean;
  maxGoals: number;
  weeklyReviewEnabled: boolean;
  insightsEnabled: boolean;
  huddleEnabled: boolean;
  exportEnabled: boolean;
  customPersonality: boolean;
  priorityResponses: boolean;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    maxCoaches: 2,
    maxMessagesPerDay: 15,
    voiceEnabled: false,
    touchpointsEnabled: false,
    maxGoals: 2,
    weeklyReviewEnabled: false,
    insightsEnabled: false,
    huddleEnabled: false,
    exportEnabled: false,
    customPersonality: false,
    priorityResponses: false,
  },
  pro: {
    maxCoaches: 6,
    maxMessagesPerDay: 100,
    voiceEnabled: true,
    touchpointsEnabled: true,
    maxGoals: 10,
    weeklyReviewEnabled: true,
    insightsEnabled: true,
    huddleEnabled: false,
    exportEnabled: true,
    customPersonality: true,
    priorityResponses: false,
  },
  elite: {
    maxCoaches: 20,
    maxMessagesPerDay: -1, // unlimited
    voiceEnabled: true,
    touchpointsEnabled: true,
    maxGoals: -1, // unlimited
    weeklyReviewEnabled: true,
    insightsEnabled: true,
    huddleEnabled: true,
    exportEnabled: true,
    customPersonality: true,
    priorityResponses: true,
  },
};

export const PLANS: PlanConfig[] = [
  {
    name: "Starter",
    tier: "free",
    price: 0,
    priceId: null,
    description: "Try CoachSquad with limited access",
    features: [
      "2 AI coaches",
      "15 messages per day",
      "Basic goal tracking",
      "Journal & mood logging",
      "Habit tracker",
    ],
    limits: PLAN_LIMITS.free,
  },
  {
    name: "Pro",
    tier: "pro",
    price: 14.99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || null,
    description: "Full coaching experience for serious growth",
    features: [
      "6 AI coaches",
      "100 messages per day",
      "Voice coaching sessions",
      "Proactive touchpoints",
      "Personality customization",
      "Weekly reviews & insights",
      "Data export",
      "10 active goals",
    ],
    limits: PLAN_LIMITS.pro,
    highlight: true,
  },
  {
    name: "Elite",
    tier: "elite",
    price: 29.99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_ELITE_PRICE_ID || null,
    description: "Unlimited access — your full coaching firm",
    features: [
      "All 20 coaches",
      "Unlimited messages",
      "Everything in Pro",
      "Coach Huddle (cross-coach coordination)",
      "Priority AI responses",
      "Unlimited goals",
      "Early access to new features",
    ],
    limits: PLAN_LIMITS.elite,
  },
];

export function getPlanByTier(tier: PlanTier): PlanConfig {
  return PLANS.find((p) => p.tier === tier) || PLANS[0];
}
