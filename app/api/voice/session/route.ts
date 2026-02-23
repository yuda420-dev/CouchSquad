import { NextRequest } from "next/server";
import { COACHES } from "@/lib/coaches/catalog";
import { buildCoachPrompt } from "@/lib/ai/prompt-builder";
import { getVoiceForCoach, buildVoiceSessionConfig } from "@/lib/voice/voice-config";
import type { Coach } from "@/lib/supabase/types";

/**
 * POST /api/voice/session
 *
 * Creates an ephemeral OpenAI Realtime session for voice conversations.
 * Returns a short-lived client token (~60s) that the browser uses to
 * establish a direct WebRTC connection with OpenAI.
 *
 * Body: { coachId: string }
 * Returns: { token, voice, model, coachName, expiresAt }
 */
export async function POST(request: NextRequest) {
  try {
    const { coachId } = await request.json();

    if (!coachId) {
      return Response.json({ error: "Missing coachId" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "OpenAI API key not configured" }, { status: 500 });
    }

    // Find coach
    const coaches = COACHES as unknown as Coach[];
    const coach = coaches.find((c) => c.id === coachId);
    if (!coach) {
      return Response.json({ error: "Coach not found" }, { status: 404 });
    }

    // Build system prompt (reusing the same prompt builder as text chat)
    const systemPrompt = buildCoachPrompt(coach, {}, [], false);

    // Get voice for this coach
    const voice = getVoiceForCoach(coachId);

    // Build session config
    const sessionConfig = buildVoiceSessionConfig(systemPrompt, voice);

    // Request ephemeral token from OpenAI Realtime API
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sessionConfig),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("OpenAI Realtime session error:", response.status, errorBody);
      return Response.json(
        { error: `Failed to create voice session: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Return the ephemeral token + metadata
    return Response.json({
      token: data.client_secret?.value,
      voice,
      model: sessionConfig.model,
      coachName: coach.name,
      accentColor: coach.accent_color,
    });
  } catch (error) {
    console.error("Voice session error:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
