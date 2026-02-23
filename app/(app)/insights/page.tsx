"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/lib/stores/app-store";
import { COACHES } from "@/lib/coaches/catalog";
import { CoachAvatarSmall } from "@/components/coach-avatar";
import {
  BarChart3,
  MessageCircle,
  Clock,
  Flame,
  Target,
  BookOpen,
  TrendingUp,
  Loader2,
  Activity,
} from "lucide-react";
import Link from "next/link";
import type { Coach } from "@/lib/supabase/types";

interface InsightsData {
  stats: {
    totalSessions: number;
    hoursCoached: number;
    streak: number;
    coachesActive: number;
    activeGoals: number;
    completedGoals: number;
    avgGoalProgress: number;
    journalEntries: number;
  };
  coachActivity: {
    coach_id: string;
    sessions: number;
    intake_completed: boolean;
    last_active: string;
    goals_active: number;
    goals_completed: number;
  }[];
  moodTrend: { date: string; value: number; mood: string; energy: string | null }[];
  weeklyActivity: { date: string; count: number }[];
}

const MOOD_EMOJIS: Record<string, string> = {
  great: "😊",
  good: "🙂",
  okay: "😐",
  low: "😔",
  bad: "😢",
};

export default function InsightsPage() {
  const roster = useAppStore((s) => s.roster);
  const coaches = COACHES as unknown as Coach[];
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadInsights = useCallback(async () => {
    try {
      const res = await fetch("/api/insights");
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch {
      // Non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Insights</h1>
        <div className="text-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading your insights...</p>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {
    totalSessions: 0,
    hoursCoached: 0,
    streak: 0,
    coachesActive: roster.length,
    activeGoals: 0,
    completedGoals: 0,
    avgGoalProgress: 0,
    journalEntries: 0,
  };

  const coachActivity = data?.coachActivity || [];
  const moodTrend = data?.moodTrend || [];
  const weeklyActivity = data?.weeklyActivity || [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-ember" />
          Insights
        </h1>
        <p className="text-muted-foreground text-sm">
          Your coaching journey at a glance. Track progress, habits, and growth.
        </p>
      </div>

      {/* Primary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={MessageCircle}
          label="Sessions"
          value={stats.totalSessions}
          color="text-blue-500"
          bgColor="bg-blue-500/10"
        />
        <StatCard
          icon={Clock}
          label="Hours Coached"
          value={stats.hoursCoached > 0 ? `${stats.hoursCoached}h` : "--"}
          color="text-green-500"
          bgColor="bg-green-500/10"
        />
        <StatCard
          icon={Flame}
          label="Journal Streak"
          value={stats.streak > 0 ? `${stats.streak} days` : "--"}
          color="text-orange-500"
          bgColor="bg-orange-500/10"
        />
        <StatCard
          icon={Target}
          label="Active Goals"
          value={stats.activeGoals}
          color="text-purple-500"
          bgColor="bg-purple-500/10"
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        <MiniStat label="Coaches" value={stats.coachesActive} />
        <MiniStat label="Goals Completed" value={stats.completedGoals} />
        <MiniStat label="Avg Progress" value={`${stats.avgGoalProgress}%`} />
        <MiniStat label="Journal Entries" value={stats.journalEntries} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column — Coach activity + weekly */}
        <div className="lg:col-span-2 space-y-6">
          {/* Weekly Activity Heatmap */}
          {weeklyActivity.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                This Week
              </h2>
              <div className="grid grid-cols-7 gap-2">
                {weeklyActivity.map((day) => {
                  const dayName = new Date(day.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" });
                  const isToday = day.date === new Date().toISOString().slice(0, 10);
                  return (
                    <div
                      key={day.date}
                      className={`rounded-lg border p-3 text-center transition-colors ${
                        isToday ? "border-ember/30 bg-ember/5" : "border-border/50 bg-card"
                      }`}
                    >
                      <p className="text-[10px] text-muted-foreground mb-1">{dayName}</p>
                      <div
                        className={`w-8 h-8 rounded-lg mx-auto flex items-center justify-center text-sm font-bold ${
                          day.count > 2
                            ? "bg-ember text-white"
                            : day.count > 0
                            ? "bg-ember/20 text-ember"
                            : "bg-muted text-muted-foreground/40"
                        }`}
                      >
                        {day.count}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Coach Activity */}
          <section>
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              Coach Activity
            </h2>
            {coachActivity.length === 0 && roster.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground rounded-xl border border-dashed border-border/50 text-sm">
                <p>Add coaches to your squad to track activity.</p>
                <Link href="/discover" className="text-ember hover:text-ember/80 text-xs mt-1 inline-block">
                  Discover Coaches
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {(coachActivity.length > 0 ? coachActivity : roster).map((item) => {
                  const coachId = "coach_id" in item ? item.coach_id : "";
                  const coach = coaches.find((c) => c.id === coachId);
                  if (!coach) return null;

                  const activity = coachActivity.find((a) => a.coach_id === coachId);
                  const sessions = activity?.sessions || 0;
                  const goalsActive = activity?.goals_active || 0;
                  const goalsCompleted = activity?.goals_completed || 0;
                  const lastActive = activity?.last_active;

                  return (
                    <Link
                      key={coachId}
                      href={`/coach/${coachId}/chat`}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card hover:border-border/80 transition-colors"
                    >
                      <CoachAvatarSmall
                        name={coach.name}
                        accentColor={coach.accent_color || "#e8633b"}
                        size={32}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{coach.name}</p>
                        <p className="text-[10px] text-muted-foreground">{coach.sub_domain || coach.domain}</p>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <p className="text-sm font-semibold">{sessions}</p>
                          <p className="text-[10px] text-muted-foreground">sessions</p>
                        </div>
                        {(goalsActive > 0 || goalsCompleted > 0) && (
                          <div>
                            <p className="text-sm font-semibold text-emerald-600">
                              {goalsActive}
                              {goalsCompleted > 0 && (
                                <span className="text-amber-500 ml-0.5">+{goalsCompleted}</span>
                              )}
                            </p>
                            <p className="text-[10px] text-muted-foreground">goals</p>
                          </div>
                        )}
                        {lastActive && (
                          <p className="text-[10px] text-muted-foreground w-14 text-right">
                            {formatRelativeTime(lastActive)}
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right column — Mood trend + Goals */}
        <div className="space-y-6">
          {/* Mood Trend */}
          <section>
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              Mood Trend
            </h2>
            {moodTrend.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/50 p-6 text-center">
                <p className="text-xs text-muted-foreground mb-2">No mood data yet</p>
                <Link href="/journal" className="text-xs text-ember hover:text-ember/80">
                  Start journaling
                </Link>
              </div>
            ) : (
              <div className="rounded-xl border border-border/50 bg-card p-4">
                <div className="flex items-end gap-0.5 h-16 mb-2">
                  {moodTrend.slice(-14).map((m, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t transition-all"
                      style={{
                        height: `${(m.value / 5) * 100}%`,
                        backgroundColor:
                          m.value >= 4
                            ? "#10b981"
                            : m.value >= 3
                            ? "#f59e0b"
                            : "#ef4444",
                        opacity: 0.6 + (i / 14) * 0.4,
                      }}
                      title={`${MOOD_EMOJIS[m.mood] || ""} ${m.mood}`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-[9px] text-muted-foreground">
                  <span>2 weeks ago</span>
                  <span>Today</span>
                </div>
                <div className="flex gap-1 mt-3 pt-3 border-t border-border/30">
                  {moodTrend.slice(-5).map((m, i) => (
                    <span key={i} className="text-sm" title={m.mood}>
                      {MOOD_EMOJIS[m.mood] || "😐"}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Goal Progress */}
          <section>
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              Goal Progress
            </h2>
            {stats.activeGoals === 0 && stats.completedGoals === 0 ? (
              <div className="rounded-xl border border-dashed border-border/50 p-6 text-center">
                <p className="text-xs text-muted-foreground mb-2">No goals yet</p>
                <Link href="/goals" className="text-xs text-ember hover:text-ember/80">
                  Set a goal
                </Link>
              </div>
            ) : (
              <div className="rounded-xl border border-border/50 bg-card p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-3xl font-bold">{stats.avgGoalProgress}%</p>
                    <p className="text-[10px] text-muted-foreground">average progress</p>
                  </div>
                  <div className="w-16 h-16 relative">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <circle
                        cx="18"
                        cy="18"
                        r="15.9"
                        fill="none"
                        stroke="currentColor"
                        className="text-muted/30"
                        strokeWidth="3"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="15.9"
                        fill="none"
                        stroke="currentColor"
                        className="text-ember"
                        strokeWidth="3"
                        strokeDasharray={`${stats.avgGoalProgress} ${100 - stats.avgGoalProgress}`}
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    {stats.activeGoals} active
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    {stats.completedGoals} completed
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* Quick links */}
          <div className="space-y-2">
            <Link
              href="/goals"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <Target className="w-4 h-4" /> View all goals
            </Link>
            <Link
              href="/journal"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <BookOpen className="w-4 h-4" /> Open journal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bgColor,
}: {
  icon: typeof MessageCircle;
  label: string;
  value: string | number;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-4">
      <div className={`w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center mb-2`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border/30 bg-muted/30 px-3 py-2 text-center">
      <p className="text-sm font-semibold">{value}</p>
      <p className="text-[9px] text-muted-foreground">{label}</p>
    </div>
  );
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
