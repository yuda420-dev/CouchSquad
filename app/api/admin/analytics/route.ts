import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase service config");
  return createClient(url, key);
}

/**
 * GET /api/admin/analytics
 * Returns aggregate platform metrics. Protected by ADMIN_API_KEY.
 *
 * Query params:
 *   ?period=7d (default) | 30d | 90d | all
 */
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get("x-admin-key");
  if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const period = request.nextUrl.searchParams.get("period") || "7d";
  const daysMap: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
  const days = daysMap[period];

  const supabase = getServiceClient();
  const sinceDate = days
    ? new Date(Date.now() - days * 86400000).toISOString()
    : "2020-01-01T00:00:00Z";

  // Run all analytics queries in parallel
  const [
    totalEventsRes,
    eventsByTypeRes,
    topCoachesRes,
    domainBreakdownRes,
    dailyVolumeRes,
  ] = await Promise.all([
    // Total events in period
    supabase
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sinceDate),

    // Events grouped by type
    supabase
      .from("analytics_events")
      .select("event_type")
      .gte("created_at", sinceDate),

    // Top coaches by message volume
    supabase
      .from("analytics_events")
      .select("coach_id")
      .eq("event_type", "message_sent")
      .gte("created_at", sinceDate)
      .not("coach_id", "is", null),

    // Domain breakdown
    supabase
      .from("analytics_events")
      .select("domain")
      .eq("event_type", "message_sent")
      .gte("created_at", sinceDate)
      .not("domain", "is", null),

    // Daily message volume (last N days)
    supabase
      .from("analytics_events")
      .select("created_at")
      .eq("event_type", "message_sent")
      .gte("created_at", sinceDate),
  ]);

  // Aggregate event types
  const eventCounts: Record<string, number> = {};
  (eventsByTypeRes.data || []).forEach((e: { event_type: string }) => {
    eventCounts[e.event_type] = (eventCounts[e.event_type] || 0) + 1;
  });

  // Top coaches
  const coachCounts: Record<string, number> = {};
  (topCoachesRes.data || []).forEach((e: { coach_id: string }) => {
    coachCounts[e.coach_id] = (coachCounts[e.coach_id] || 0) + 1;
  });
  const topCoaches = Object.entries(coachCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([coach_id, count]) => ({ coach_id, messages: count }));

  // Domain breakdown
  const domainCounts: Record<string, number> = {};
  (domainBreakdownRes.data || []).forEach((e: { domain: string }) => {
    domainCounts[e.domain] = (domainCounts[e.domain] || 0) + 1;
  });

  // Daily volume
  const dailyCounts: Record<string, number> = {};
  (dailyVolumeRes.data || []).forEach((e: { created_at: string }) => {
    const day = e.created_at.slice(0, 10);
    dailyCounts[day] = (dailyCounts[day] || 0) + 1;
  });

  return Response.json({
    period,
    since: sinceDate,
    totalEvents: totalEventsRes.count || 0,
    eventsByType: eventCounts,
    topCoaches,
    messagesByDomain: domainCounts,
    dailyMessageVolume: dailyCounts,
  });
}
