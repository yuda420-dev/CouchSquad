/**
 * Voice configuration for OpenAI Realtime API.
 *
 * Every coach — regardless of their text-chat AI provider — uses OpenAI
 * Realtime for voice conversations. Each coach is mapped to one of
 * OpenAI's built-in voices based on personality fit.
 */

export type OpenAIVoice = "alloy" | "ash" | "ballad" | "coral" | "sage" | "verse" | "marin" | "cedar";

export type VoiceSessionState =
  | "idle"
  | "connecting"
  | "connected"
  | "listening"
  | "speaking"
  | "disconnected"
  | "error";

export const REALTIME_MODEL = "gpt-4o-realtime-preview";

/**
 * Maps coach IDs to OpenAI Realtime voices.
 *
 * Voice selection rationale:
 * - ash:    Deep, authoritative — strength coaches, military leader
 * - coral:  Warm, calm — yoga, parenting, attachment therapy
 * - sage:   Professional, measured — clinical nutrition, executive, CBT
 * - ballad: Gentle, reflective — meditation, philosophy
 * - verse:  Energetic, friendly — HIIT, social skills, creativity
 * - alloy:  Neutral, balanced — investing, meal prep, structured parenting
 * - marin:  Bright, youthful — intuitive eating, frugality
 * - cedar:  Warm, grounded — entrepreneurship, gardening
 */
const VOICE_MAP: Record<string, OpenAIVoice> = {
  // FITNESS
  "c0010000-0000-4000-8000-000000000001": "ash",     // Marcus "Iron" Chen — deep, direct
  "c0010000-0000-4000-8000-000000000002": "coral",   // Aria Sunstone — calm, warm
  "c0010000-0000-4000-8000-000000000003": "verse",   // Diesel (Derek Okafor) — energetic

  // NUTRITION
  "c0010000-0000-4000-8000-000000000004": "sage",    // Dr. Elena Voss — clinical, precise
  "c0010000-0000-4000-8000-000000000005": "marin",   // Jade Rivers — bright, compassionate
  "c0010000-0000-4000-8000-000000000006": "alloy",   // Chef Mateo Reyes — practical, no-nonsense

  // CAREER
  "c0010000-0000-4000-8000-000000000007": "sage",    // Victoria Ashworth — polished, strategic
  "c0010000-0000-4000-8000-000000000008": "cedar",   // Kai Nomura — energetic, real-talk

  // RELATIONSHIPS
  "c0010000-0000-4000-8000-000000000009": "coral",   // Dr. Amara Baptiste — warm, insightful
  "c0010000-0000-4000-8000-000000000010": "verse",   // Leo Vance — relatable, encouraging

  // MENTAL HEALTH
  "c0010000-0000-4000-8000-000000000011": "sage",    // Dr. Sarah Kim — structured, gentle
  "c0010000-0000-4000-8000-000000000012": "ballad",  // Bodhi — calm, spacious

  // FINANCE
  "c0010000-0000-4000-8000-000000000013": "alloy",   // Warren "The Builder" Blake — wise, data-driven
  "c0010000-0000-4000-8000-000000000014": "marin",   // Priya "Penny" Sharma — energetic, relatable

  // PARENTING
  "c0010000-0000-4000-8000-000000000015": "coral",   // Nana Grace — warm, wise
  "c0010000-0000-4000-8000-000000000016": "alloy",   // Coach Mike Brennan — practical, empathetic

  // GARDENING
  "c0010000-0000-4000-8000-000000000017": "cedar",   // Rosa Thornberry — warm, seasonal

  // LEADERSHIP
  "c0010000-0000-4000-8000-000000000018": "ash",     // Colonel Morrison — direct, structured

  // CREATIVITY
  "c0010000-0000-4000-8000-000000000019": "verse",   // Luna Wilde — inspiring, playful

  // PHILOSOPHY
  "c0010000-0000-4000-8000-000000000020": "ballad",  // Professor Atlas — deep thinker
};

/** Default fallback voice if coach not in map */
const DEFAULT_VOICE: OpenAIVoice = "alloy";

/** Get the OpenAI voice for a given coach ID */
export function getVoiceForCoach(coachId: string): OpenAIVoice {
  return VOICE_MAP[coachId] || DEFAULT_VOICE;
}

/** Check if voice features should be enabled */
export function isVoiceEnabled(): boolean {
  return process.env.NEXT_PUBLIC_VOICE_ENABLED === "true";
}

/** Voice session configuration for OpenAI Realtime */
export interface VoiceSessionConfig {
  model: string;
  voice: OpenAIVoice;
  instructions: string;
  input_audio_transcription: { model: string };
  turn_detection: {
    type: "server_vad";
    threshold: number;
    prefix_padding_ms: number;
    silence_duration_ms: number;
  };
}

/** Build the session config for a coach */
export function buildVoiceSessionConfig(
  systemPrompt: string,
  voice: OpenAIVoice,
): VoiceSessionConfig {
  return {
    model: REALTIME_MODEL,
    voice,
    instructions: systemPrompt + "\n\nIMPORTANT: You are speaking via voice. Keep responses conversational and concise — 2-4 sentences max unless the user asks for detail. Use natural speech patterns, contractions, and verbal cues like \"right\", \"so\", \"okay\". Avoid markdown, bullet points, or numbered lists — this is a spoken conversation.",
    input_audio_transcription: { model: "whisper-1" },
    turn_detection: {
      type: "server_vad",
      threshold: 0.5,
      prefix_padding_ms: 300,
      silence_duration_ms: 500,
    },
  };
}
