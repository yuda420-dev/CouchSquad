import type { PersonalityTraits } from "@/lib/supabase/types";

export interface TraitDefinition {
  key: keyof PersonalityTraits;
  label: string;
  lowLabel: string;
  highLabel: string;
  lowEmoji: string;
  highEmoji: string;
  description: string;
  category: "communication" | "approach" | "vibe";
}

export const TRAIT_CATEGORIES = [
  { id: "communication" as const, label: "Communication Style", emoji: "💬" },
  { id: "approach" as const, label: "Coaching Approach", emoji: "🎯" },
  { id: "vibe" as const, label: "Relationship & Vibe", emoji: "✨" },
];

export const PERSONALITY_TRAITS: TraitDefinition[] = [
  // ─── Communication Style ────────────────────
  {
    key: "humor",
    label: "Humor",
    lowLabel: "Serious",
    highLabel: "Playful",
    lowEmoji: "🎯",
    highEmoji: "😂",
    description: "How often they use wit, jokes, and playful language",
    category: "communication",
  },
  {
    key: "directness",
    label: "Directness",
    lowLabel: "Gentle",
    highLabel: "Blunt",
    lowEmoji: "🌸",
    highEmoji: "⚡",
    description: "How straight they shoot — soft suggestions vs. hard truth",
    category: "communication",
  },
  {
    key: "warmth",
    label: "Warmth",
    lowLabel: "Professional",
    highLabel: "Empathetic",
    lowEmoji: "🤝",
    highEmoji: "💛",
    description: "Emotional tone — distance vs. deep empathy",
    category: "communication",
  },
  {
    key: "formality",
    label: "Formality",
    lowLabel: "Casual",
    highLabel: "Formal",
    lowEmoji: "👋",
    highEmoji: "🎩",
    description: "Slang and emojis vs. structured, professional language",
    category: "communication",
  },
  // ─── Coaching Approach ──────────────────────
  {
    key: "socratic",
    label: "Socratic",
    lowLabel: "Answers",
    highLabel: "Questions",
    lowEmoji: "📝",
    highEmoji: "🤔",
    description: "Do they give you the answer or guide you to find it?",
    category: "approach",
  },
  {
    key: "intensity",
    label: "Intensity",
    lowLabel: "Relaxed",
    highLabel: "Intense",
    lowEmoji: "🧘",
    highEmoji: "🔥",
    description: "Pressure level — chill vibes vs. high accountability",
    category: "approach",
  },
  {
    key: "patience",
    label: "Pacing",
    lowLabel: "Brisk",
    highLabel: "Unhurried",
    lowEmoji: "⏩",
    highEmoji: "🐢",
    description: "How fast they push through topics vs. take their time",
    category: "approach",
  },
  {
    key: "detail",
    label: "Detail Level",
    lowLabel: "Big Picture",
    highLabel: "Granular",
    lowEmoji: "🌍",
    highEmoji: "🔬",
    description: "High-level strategy vs. step-by-step specifics",
    category: "approach",
  },
  // ─── Relationship & Vibe ────────────────────
  {
    key: "encouragement",
    label: "Encouragement",
    lowLabel: "Challenging",
    highLabel: "Cheerleading",
    lowEmoji: "🏔️",
    highEmoji: "📣",
    description: "Pushes you to prove yourself vs. celebrates every step",
    category: "vibe",
  },
  {
    key: "storytelling",
    label: "Storytelling",
    lowLabel: "Data-Driven",
    highLabel: "Narrative",
    lowEmoji: "📊",
    highEmoji: "📖",
    description: "Facts and numbers vs. stories and analogies",
    category: "vibe",
  },
  {
    key: "tough_love",
    label: "Tough Love",
    lowLabel: "Supportive",
    highLabel: "Hard Truths",
    lowEmoji: "🫂",
    highEmoji: "💎",
    description: "Always supportive first vs. pushes when you slack off",
    category: "vibe",
  },
  {
    key: "adaptability",
    label: "Adaptability",
    lowLabel: "Consistent",
    highLabel: "Mood-Aware",
    lowEmoji: "⚓",
    highEmoji: "🌊",
    description: "Same style every time vs. adapts to how you're feeling",
    category: "vibe",
  },
];

/** Just the original 6 core traits (for backwards compat with flower chart, etc.) */
export const CORE_TRAIT_KEYS: (keyof PersonalityTraits)[] = [
  "humor", "directness", "warmth", "intensity", "socratic", "formality",
];

export const DEFAULT_PERSONALITY: PersonalityTraits = {
  humor: 50,
  directness: 50,
  warmth: 50,
  formality: 50,
  socratic: 50,
  intensity: 50,
  patience: 50,
  detail: 50,
  encouragement: 50,
  storytelling: 50,
  tough_love: 50,
  adaptability: 50,
};

export function mergePersonality(
  base: PersonalityTraits,
  overrides: Partial<PersonalityTraits>
): PersonalityTraits {
  return { ...DEFAULT_PERSONALITY, ...base, ...overrides };
}
