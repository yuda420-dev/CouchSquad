import { createClient } from "@supabase/supabase-js";

/**
 * Anonymous analytics event tracking.
 *
 * Events are stored WITHOUT user_id — we track aggregate platform metrics
 * (which coaches are popular, message volume by domain, etc.) but never
 * link activity to individual users.
 */

type AnalyticsEvent = {
  event_type: string;
  coach_id?: string;
  domain?: string;
  plan_tier?: string;
  metadata?: Record<string, unknown>;
};

let _analyticsClient: ReturnType<typeof createClient> | null = null;

function getAnalyticsClient() {
  if (!_analyticsClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) return null;
    _analyticsClient = createClient(url, serviceKey);
  }
  return _analyticsClient;
}

/**
 * Fire-and-forget anonymous event tracking.
 * Never throws — analytics should never break user-facing features.
 */
export function trackEvent(event: AnalyticsEvent): void {
  const client = getAnalyticsClient();
  if (!client) return;

  // Fire and forget — don't await
  // Use `as any` because analytics_events isn't in the generated Database type
  (client.from("analytics_events") as any)
    .insert({
      event_type: event.event_type,
      coach_id: event.coach_id || null,
      domain: event.domain || null,
      plan_tier: event.plan_tier || null,
      metadata: event.metadata || {},
    })
    .then(({ error }: { error: { message: string } | null }) => {
      if (error) console.error("Analytics tracking error:", error.message);
    });
}

// ── Convenience helpers ──────────────────────────────────────

export function trackMessageSent(coachId: string, domain: string) {
  trackEvent({ event_type: "message_sent", coach_id: coachId, domain });
}

export function trackCoachAdded(coachId: string, domain: string) {
  trackEvent({ event_type: "coach_added", coach_id: coachId, domain });
}

export function trackCoachRemoved(coachId: string, domain: string) {
  trackEvent({ event_type: "coach_removed", coach_id: coachId, domain });
}

export function trackSessionStarted(coachId: string, domain: string) {
  trackEvent({ event_type: "session_started", coach_id: coachId, domain });
}

export function trackGoalCreated(domain?: string) {
  trackEvent({ event_type: "goal_created", domain });
}

export function trackJournalEntry() {
  trackEvent({ event_type: "journal_entry" });
}

export function trackSubscriptionChanged(planTier: string) {
  trackEvent({ event_type: "subscription_changed", plan_tier: planTier });
}

export function trackVoiceSession(coachId: string, domain: string, durationSeconds?: number) {
  trackEvent({
    event_type: "voice_session",
    coach_id: coachId,
    domain,
    metadata: durationSeconds ? { duration_seconds: durationSeconds } : {},
  });
}
