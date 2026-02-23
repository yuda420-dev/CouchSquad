import type { SupabaseClient } from "@supabase/supabase-js";
import type { CoachMemory } from "@/lib/supabase/types";
import { encrypt, tryDecrypt, isEncryptionEnabled } from "@/lib/crypto/encryption";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any>;

/**
 * Extract memorable facts from a conversation exchange.
 *
 * Uses a lightweight AI call to identify key personal details,
 * goals, preferences, and achievements from the user's messages.
 *
 * Returns structured facts ready for storage.
 */
export async function extractFacts(
  userMessage: string,
  assistantMessage: string,
  coachDomain: string
): Promise<Array<{ fact: string; category: CoachMemory["category"]; importance: number }>> {
  // Use OpenAI for extraction (faster + cheaper for structured output)
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return [];

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0,
        max_tokens: 500,
        messages: [
          {
            role: "system",
            content: `You extract key facts about a person from a coaching conversation in the "${coachDomain}" domain. Return a JSON array of facts. Each fact should be:
- A concise statement about the user (e.g., "Runs 3x per week", "Has two kids ages 5 and 8", "Goal: lose 20 pounds by June")
- Categorized as one of: personal, goal, preference, achievement, challenge
- Rated 1-10 for importance (10 = critical goal/identity fact, 1 = trivial detail)

Only extract facts explicitly stated or strongly implied by the USER. Do not invent information. Skip pleasantries, greetings, and meta-conversation. If there are no meaningful facts, return an empty array.

Respond ONLY with valid JSON: [{"fact": "...", "category": "...", "importance": N}]`,
          },
          {
            role: "user",
            content: `USER said: "${userMessage}"\n\nCOACH replied: "${assistantMessage}"`,
          },
        ],
      }),
    });

    if (!response.ok) return [];

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return [];

    // Parse the JSON response
    const facts = JSON.parse(content);
    if (!Array.isArray(facts)) return [];

    return facts
      .filter(
        (f: { fact?: string; category?: string; importance?: number }) =>
          f.fact && f.category && typeof f.importance === "number"
      )
      .map((f: { fact: string; category: string; importance: number }) => ({
        fact: f.fact,
        category: f.category as CoachMemory["category"],
        importance: Math.min(10, Math.max(1, f.importance)),
      }));
  } catch (err) {
    console.error("Memory extraction error:", err);
    return [];
  }
}

/**
 * Save extracted facts to the coach_memory table.
 * Deduplicates against existing facts (checks for similar content).
 */
export async function saveFacts(
  supabase: Client,
  userId: string,
  coachId: string,
  facts: Array<{ fact: string; category: CoachMemory["category"]; importance: number }>
): Promise<void> {
  if (!facts.length) return;

  // Load existing facts to avoid duplicates
  const { data: existing } = await supabase
    .from("coach_memory")
    .select("fact, encrypted")
    .eq("user_id", userId)
    .eq("coach_id", coachId);

  const existingFacts = new Set(
    (existing || []).map((e: { fact: string; encrypted?: boolean }) => {
      const plainFact = e.encrypted ? tryDecrypt(e.fact, userId) : e.fact;
      return plainFact.toLowerCase();
    })
  );

  // Filter out facts that are too similar to existing ones
  const newFacts = facts.filter(
    (f) => !existingFacts.has(f.fact.toLowerCase())
  );

  if (!newFacts.length) return;

  const shouldEncrypt = isEncryptionEnabled();
  const { error } = await supabase.from("coach_memory").insert(
    newFacts.map((f) => ({
      user_id: userId,
      coach_id: coachId,
      fact: shouldEncrypt ? encrypt(f.fact, userId) : f.fact,
      category: f.category,
      importance: f.importance,
      source: "conversation" as const,
      encrypted: shouldEncrypt,
    }))
  );

  if (error) {
    console.error("Failed to save memory facts:", error);
  }
}

/**
 * Load all memories for a user+coach pair, ordered by importance.
 */
export async function loadMemories(
  supabase: Client,
  userId: string,
  coachId: string,
  limit = 50
): Promise<CoachMemory[]> {
  const { data, error } = await supabase
    .from("coach_memory")
    .select("*")
    .eq("user_id", userId)
    .eq("coach_id", coachId)
    .order("importance", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to load memories:", error);
    return [];
  }

  const memories = (data || []) as (CoachMemory & { encrypted?: boolean })[];

  // Decrypt encrypted memories
  return memories.map((m) => ({
    ...m,
    fact: m.encrypted ? tryDecrypt(m.fact, userId) : m.fact,
  }));
}

/**
 * Full memory extraction pipeline.
 * Call this after each conversation exchange to extract and store facts.
 */
export async function processConversationMemory(
  supabase: Client,
  userId: string,
  coachId: string,
  coachDomain: string,
  userMessage: string,
  assistantMessage: string
): Promise<void> {
  try {
    const facts = await extractFacts(userMessage, assistantMessage, coachDomain);
    if (facts.length > 0) {
      await saveFacts(supabase, userId, coachId, facts);
    }
  } catch (err) {
    // Memory extraction is non-critical — don't break the chat
    console.error("Memory processing error:", err);
  }
}
