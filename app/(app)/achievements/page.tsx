"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/lib/stores/app-store";
import { computeAchievements, getAchievementSummary, type Achievement } from "@/lib/gamification";
import { Trophy, Loader2, Lock } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  sessions: "Coaching Sessions",
  streaks: "Streaks",
  goals: "Goals",
  journal: "Journal & Mood",
  squad: "Your Squad",
  voice: "Voice",
  special: "Special",
};

export default function AchievementsPage() {
  const roster = useAppStore((s) => s.roster);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      // Fetch all data needed for achievement computation
      const [insightsRes, statsRes, activityRes, bookmarksRes] = await Promise.all([
        fetch("/api/insights"),
        fetch("/api/journal?type=stats"),
        fetch("/api/activity?stats=true"),
        fetch("/api/bookmarks"),
      ]);

      let totalSessions = 0;
      let totalMessages = 0;
      let activeGoals = 0;
      let completedGoals = 0;
      let domains: string[] = [];

      if (insightsRes.ok) {
        const data = await insightsRes.json();
        totalSessions = data.stats?.totalSessions || 0;
        activeGoals = data.stats?.activeGoals || 0;
        completedGoals = data.stats?.completedGoals || 0;
        // Estimate messages from sessions
        totalMessages = totalSessions * 8; // rough estimate
        domains = [...new Set(
          roster.map((r) => {
            const activity = data.coachActivity?.find(
              (a: any) => a.coach_id === r.coach_id
            );
            return activity ? "active" : null;
          }).filter(Boolean)
        )] as string[];
      }

      let journalEntries = 0;
      let journalStreak = 0;
      let moodEntries = 0;

      if (statsRes.ok) {
        const { stats } = await statsRes.json();
        journalEntries = stats?.totalEntries || 0;
        journalStreak = stats?.streak || 0;
        moodEntries = stats?.totalEntries || 0; // Mood entries come with journal
      }

      let activityLogs = 0;
      if (activityRes.ok) {
        const { stats } = await activityRes.json();
        activityLogs = stats?.totalLogs || 0;
      }

      let bookmarks = 0;
      if (bookmarksRes.ok) {
        const { bookmarks: bks } = await bookmarksRes.json();
        bookmarks = bks?.length || 0;
      }

      // Compute unique domains from roster coaches
      const { COACHES } = await import("@/lib/coaches/catalog");
      const coaches = COACHES as any[];
      const uniqueDomains = [
        ...new Set(
          roster.map((r) => coaches.find((c) => c.id === r.coach_id)?.domain).filter(Boolean)
        ),
      ];

      const intakesCompleted = roster.filter((r) => r.intake_completed).length;

      const voiceSessions = 0; // TODO: track voice session count

      const computed = computeAchievements({
        totalSessions,
        totalMessages,
        coachesOnRoster: roster.length,
        intakesCompleted,
        activeGoals,
        completedGoals,
        journalEntries,
        journalStreak,
        moodEntries,
        voiceSessions,
        bookmarks,
        activityLogs,
        domains: uniqueDomains as string[],
      });

      setAchievements(computed);
    } catch {
      // Non-critical
    } finally {
      setLoading(false);
    }
  }, [roster]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Achievements</h1>
        <div className="text-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Computing achievements...</p>
        </div>
      </div>
    );
  }

  const summary = getAchievementSummary(achievements);

  // Group by category
  const categories = Object.keys(CATEGORY_LABELS);
  const grouped = categories.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    items: achievements.filter((a) => a.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Trophy className="w-8 h-8 text-amber-500" />
          Achievements
        </h1>
        <p className="text-muted-foreground text-sm">
          Track your milestones and celebrate your progress.
        </p>
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-border/50 bg-card p-6 mb-8">
        <div className="flex items-center gap-6">
          {/* Progress ring */}
          <div className="w-20 h-20 relative shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="15.9"
                fill="none"
                stroke="currentColor"
                className="text-muted/30"
                strokeWidth="2.5"
              />
              <circle
                cx="18"
                cy="18"
                r="15.9"
                fill="none"
                stroke="currentColor"
                className="text-amber-500"
                strokeWidth="2.5"
                strokeDasharray={`${summary.percentage} ${100 - summary.percentage}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold">{summary.percentage}%</span>
            </div>
          </div>

          <div>
            <p className="text-2xl font-bold">
              {summary.earned} <span className="text-muted-foreground font-normal text-sm">/ {summary.total}</span>
            </p>
            <p className="text-sm text-muted-foreground">achievements earned</p>
          </div>

          {/* Recently earned */}
          {summary.recentlyEarned.length > 0 && (
            <div className="ml-auto flex gap-2">
              {summary.recentlyEarned.map((a) => (
                <span key={a.id} className="text-2xl" title={a.title}>
                  {a.icon}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Achievement categories */}
      <div className="space-y-8">
        {grouped.map((group) => (
          <section key={group.category}>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
              {group.label}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {group.items.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`rounded-xl border p-4 transition-all ${
                    achievement.earned
                      ? "border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30"
                      : "border-border/50 bg-card opacity-60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">
                      {achievement.earned ? achievement.icon : "🔒"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${!achievement.earned && "text-muted-foreground"}`}>
                        {achievement.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {achievement.description}
                      </p>

                      {/* Progress bar */}
                      {!achievement.earned && achievement.progress !== undefined && (
                        <div className="mt-2">
                          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-amber-400 transition-all"
                              style={{ width: `${achievement.progress}%` }}
                            />
                          </div>
                          <p className="text-[9px] text-muted-foreground mt-0.5">
                            {Math.round(achievement.progress)}%
                          </p>
                        </div>
                      )}

                      {achievement.earned && (
                        <p className="text-[9px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
                          Earned!
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
