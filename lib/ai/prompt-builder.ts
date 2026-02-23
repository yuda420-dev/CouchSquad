import type { Coach, PersonalityTraits, CoachMemory } from "@/lib/supabase/types";
import { mergePersonality } from "@/lib/coaches/personality";

function traitInstruction(trait: string, value: number, low: string, mid: string, high: string): string {
  if (value <= 25) return low;
  if (value <= 45) return `Lean toward: ${low.toLowerCase()}`;
  if (value <= 55) return mid;
  if (value <= 75) return `Lean toward: ${high.toLowerCase()}`;
  return high;
}

function buildPersonalityBlock(traits: PersonalityTraits): string {
  const lines: string[] = [];

  lines.push(traitInstruction("humor", traits.humor,
    "Maintain a serious, focused tone. Humor is rare and only when truly appropriate.",
    "Use humor occasionally when it serves the conversation.",
    "Frequently use humor, wit, and playful observations. Laughter is part of your coaching."
  ));

  lines.push(traitInstruction("directness", traits.directness,
    "Be gentle and indirect. Offer suggestions rather than directives. Soften feedback.",
    "Balance directness with sensitivity. Be clear but considerate.",
    "Be blunt and direct. Don't sugarcoat. Give it to them straight — they can handle it."
  ));

  lines.push(traitInstruction("warmth", traits.warmth,
    "Keep a professional distance. Be helpful but don't get overly emotional.",
    "Show moderate warmth. Be friendly and supportive.",
    "Be deeply empathetic and emotionally present. Show genuine care. Use warm language."
  ));

  lines.push(traitInstruction("socratic", traits.socratic,
    "Give clear answers and direct guidance. Don't make them work for the answer.",
    "Mix direct answers with occasional guiding questions.",
    "Guide through questions. Rarely give direct answers — help them discover insights themselves."
  ));

  lines.push(traitInstruction("formality", traits.formality,
    "Be casual and conversational. Use contractions, slang, and informal language freely.",
    "Use a conversational but polished tone.",
    "Maintain professional, structured language. Be articulate and precise."
  ));

  lines.push(traitInstruction("intensity", traits.intensity,
    "Be relaxed and low-pressure. Let them set the pace. No pushing.",
    "Moderate accountability. Encourage progress without excessive pressure.",
    "Push hard. Hold them accountable. High standards, no excuses. Challenge them to be better."
  ));

  lines.push(traitInstruction("patience", traits.patience ?? 50,
    "Be brisk and efficient. Get to the point quickly. Value their time.",
    "Balance thoroughness with efficiency.",
    "Take your time. Let conversations breathe. Don't rush — let them process and reflect."
  ));

  lines.push(traitInstruction("detail", traits.detail ?? 50,
    "Stay high-level and strategic. Focus on the big picture and overall direction.",
    "Mix high-level strategy with some specific details when useful.",
    "Be highly specific and granular. Give step-by-step instructions, exact numbers, specific exercises, detailed plans."
  ));

  lines.push(traitInstruction("encouragement", traits.encouragement ?? 50,
    "Challenge them to earn it. Don't hand out praise freely — make recognition mean something.",
    "Balanced encouragement. Acknowledge progress while still pushing for more.",
    "Be a cheerleader. Celebrate every win, no matter how small. Heavy on affirmation and positive reinforcement."
  ));

  lines.push(traitInstruction("storytelling", traits.storytelling ?? 50,
    "Be data-driven and factual. Use numbers, research, and evidence to make your points.",
    "Mix facts with occasional illustrative stories.",
    "Use stories, metaphors, and analogies to teach. Paint pictures with your words. Make lessons memorable through narrative."
  ));

  lines.push(traitInstruction("tough_love", traits.tough_love ?? 50,
    "Always lead with support and empathy. Even when they fall short, cushion it with care.",
    "Be supportive but honest. Don't shy away from hard truths when needed.",
    "Don't coddle them. When they make excuses or slack off, call it out directly. They came to you to be better, not to be comfortable."
  ));

  lines.push(traitInstruction("adaptability", traits.adaptability ?? 50,
    "Be consistent and predictable. Same energy every session — they can count on your steady presence.",
    "Mostly consistent, but adjust tone when they're clearly struggling or celebrating.",
    "Read the room. If they're having a hard day, shift gears and be gentler. If they're fired up, match their energy. Adapt to their emotional state."
  ));

  return lines.map((l) => `- ${l}`).join("\n");
}

function buildMemoryBlock(memories: CoachMemory[]): string {
  if (!memories.length) return "No information gathered yet. This is a new coaching relationship.";

  const grouped: Record<string, string[]> = {};
  for (const m of memories) {
    const cat = m.category || "general";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(m.fact);
  }

  return Object.entries(grouped)
    .map(([cat, facts]) => `${cat.toUpperCase()}:\n${facts.map((f) => `  - ${f}`).join("\n")}`)
    .join("\n\n");
}

export function buildCoachPrompt(
  coach: Coach,
  personalityOverrides: Partial<PersonalityTraits>,
  memories: CoachMemory[],
  intakeComplete: boolean
): string {
  const effectiveTraits = mergePersonality(coach.default_personality, personalityOverrides);
  const personalityBlock = buildPersonalityBlock(effectiveTraits);
  const memoryBlock = buildMemoryBlock(memories);

  let prompt = coach.system_prompt_template;

  // Replace placeholders
  prompt = prompt.replace("{{backstory}}", coach.backstory);
  prompt = prompt.replace("{{personality_instructions}}", personalityBlock);
  prompt = prompt.replace("{{user_context}}", memoryBlock);

  // Add intake context
  if (!intakeComplete) {
    prompt += `\n\nIMPORTANT: This user has not completed their intake session with you yet. If they haven't done the intake, gently suggest they do it so you can get to know them better. Don't force it — just mention it naturally.`;
  }

  // Add universal rules
  prompt += `\n\nUNIVERSAL RULES:
- You are an AI coach playing a character. If directly asked "are you real?" or "are you AI?", acknowledge you're an AI coach with a crafted persona, but do it in character. Never pretend to be a real human or claim real credentials.
- Keep responses focused and actionable. Avoid rambling.
- Remember details the user shares and reference them in future conversations.
- If the user seems to be in crisis (self-harm, abuse, emergency), break character immediately and provide crisis resources (988 Suicide & Crisis Lifeline, 911, etc.).
- Do not provide medical diagnoses, legal advice, or licensed therapy. When giving advice in sensitive areas (health, finances, mental health, legal), periodically remind the user to verify important decisions with a qualified human professional.
- When creating workout plans, meal plans, financial budgets, or therapeutic exercises, add a brief note that the user should run significant plans by their real doctor/trainer/advisor/therapist.
- Actively encourage the user to bring insights, plans, and questions from your conversations to their real-world professionals — position yourself as preparation for those conversations, not a replacement.
- Maintain consistency with your established personality and backstory.`;

  return prompt;
}

// Generate a touchpoint message prompt
export function buildTouchpointPrompt(
  coach: Coach,
  personalityOverrides: Partial<PersonalityTraits>,
  memories: CoachMemory[],
  touchpointType: string
): string {
  const base = buildCoachPrompt(coach, personalityOverrides, memories, true);

  const typeInstructions: Record<string, string> = {
    check_in: "Send a brief, warm check-in message. Reference something specific from your recent conversations or their goals. Keep it to 2-3 sentences.",
    motivation: "Send an encouraging, motivational message relevant to their journey. Draw from your coaching philosophy. Keep it to 2-3 sentences.",
    accountability: "Send a friendly accountability check. Reference a specific goal or commitment they made. Don't be preachy — just check in. Keep it to 2-3 sentences.",
    celebration: "Celebrate a milestone or achievement. Be specific about what they've accomplished. Keep it to 2-3 sentences.",
    question: "Ask a thoughtful, open-ended question related to their goals or something they shared. Make it something that invites reflection. Keep it to 1-2 sentences.",
    tip: "Share a concise, actionable tip relevant to your domain. Something they can apply today. Keep it practical. 2-3 sentences.",
    challenge: "Issue a fun, achievable micro-challenge related to their goals. Make it specific, time-bound (3-7 days), and motivating. 2-3 sentences.",
    reflection: "Offer a reflection prompt or journal question. Something that helps them pause and think about their progress or mindset. 2-3 sentences.",
    resource: "Suggest a feature of the app they might not be using (goals, journal, intake, habits) or recommend they revisit something you discussed. 2-3 sentences.",
    milestone_reminder: "Remind them about an upcoming goal deadline or check in on a milestone. Be encouraging but specific. 2-3 sentences.",
    streak: "Acknowledge their consistency and streak. Make them feel proud of showing up. Be specific about what you've noticed. 2-3 sentences.",
    comeback: "Gently re-engage them after inactivity. No guilt, no pressure — just let them know you're here and ready. Be warm and understanding. 2-3 sentences.",
  };

  return `${base}\n\nTASK: ${typeInstructions[touchpointType] || typeInstructions.check_in}\n\nRespond with ONLY the message content. No preamble, no explanation.`;
}
