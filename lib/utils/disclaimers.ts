// ─── AI Disclaimer & Disclosure Constants ─────────────────────
// Centralized disclaimer content for consistent messaging across the app.
//
// Philosophy: Be honest and upfront that these are AI coaches with
// fictional backgrounds. But also communicate the genuine value —
// directional guidance across many life domains that would otherwise
// require a team of expensive specialists. Users can take outputs
// to their real coaches, therapists, and advisors for the things
// that really matter.

export const DISCLAIMERS = {
  // One-liner used beneath chat input, coach cards, etc.
  short:
    "AI coach — not a licensed professional. For guidance, not a substitute for expert advice.",

  // Medium-length used at signup, onboarding, and key moments
  medium:
    "CoachSquad coaches are AI characters with fictional backgrounds. They provide directional guidance — not professional medical, financial, legal, or therapeutic advice. For decisions that really matter, take what you learn here to a qualified human professional.",

  // The value proposition framing
  valueProp:
    "Think of your squad as a brainstorming team that's always available. The kind of multi-domain support system that would cost millions to assemble in real life. Use their guidance to explore ideas, build habits, and prepare better questions for the 1-2 real professionals who matter most in your life.",

  // Crisis override — always shown when relevant
  crisis:
    "If you're in crisis or experiencing a medical emergency, please contact 988 (Suicide & Crisis Lifeline), 911, or your local emergency services immediately.",

  // Domain-specific disclaimers
  domains: {
    fitness:
      "AI fitness guidance is not a substitute for a certified personal trainer or physician. Consult a doctor before starting any exercise program.",
    nutrition:
      "AI nutrition guidance is not a substitute for a registered dietitian or physician. Consult a healthcare professional for dietary needs.",
    mental_health:
      "AI mental health support is not therapy or counseling. If you're struggling, please reach out to a licensed therapist or counselor.",
    finance:
      "AI financial guidance is not professional financial advice. Consult a certified financial advisor for investment and planning decisions.",
    career:
      "AI career guidance is general in nature. For major career decisions, consider consulting a career counselor or mentor in your field.",
    parenting:
      "AI parenting guidance is not a substitute for pediatric or child psychology professionals. Consult experts for specific concerns.",
    health:
      "AI health guidance is not medical advice. Always consult a licensed healthcare provider for health concerns.",
  } as Record<string, string>,

  // Full disclosure page content sections
  full: {
    title: "About CoachSquad's AI Coaches",
    subtitle:
      "Transparency is important to us. Here's exactly what you're getting.",

    whatTheyAre: {
      heading: "What Our Coaches Are",
      points: [
        "AI characters powered by large language models (Claude and GPT-4)",
        "Each coach has a fictional backstory, personality, and area of focus",
        "Their \"expertise\" comes from AI training data, not real-world professional experience",
        "They remember your conversations and learn your preferences over time",
        "They're available 24/7 and cover domains from fitness to finance to philosophy",
      ],
    },

    whatTheyAreNot: {
      heading: "What Our Coaches Are Not",
      points: [
        "Not licensed professionals in any field (medical, legal, financial, psychological, etc.)",
        "Not real people with genuine life experiences or credentials",
        "Not a substitute for therapy, medical care, financial planning, or other professional services",
        "Not able to diagnose conditions, prescribe treatments, or provide legally binding advice",
        "Not infallible — AI can be confidently wrong",
      ],
    },

    whyItsStillValuable: {
      heading: "Why It's Still Valuable",
      points: [
        "Having a team of 12 real coaches across different life domains would cost $50,000–$500,000+ per year",
        "Most people get zero coaching in most areas of their life — this closes that gap",
        "Don't let the perfect be the enemy of the good: directional guidance is better than no guidance",
        "Use your AI coaches to explore ideas, build daily habits, and prepare smarter questions for the 1-2 real professionals in your life",
        "Export conversations, plans, and insights to share with your real doctor, therapist, trainer, or financial advisor",
        "Think of it as a support system that helps you get more out of the real relationships that matter",
      ],
    },

    howToUseWell: {
      heading: "How to Get the Most Out of CoachSquad",
      points: [
        "Use your squad for brainstorming, accountability, habit tracking, and daily reflection",
        "When a coach suggests something that matters (a workout plan, a budget, a coping strategy), run it by your real professional",
        "Export insights and bring them to appointments with your doctor, therapist, or advisor",
        "Treat coach advice as a starting point, not a final answer",
        "For anything involving your health, finances, legal situation, or mental wellbeing — always verify with a qualified human",
      ],
    },
  },
} as const;
