"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/stores/app-store";
import { CoachAvatarSmall } from "@/components/coach-avatar";
import { MoodCheckIn } from "@/components/mood-check-in";
import { COACHES } from "@/lib/coaches/catalog";
import type { Coach } from "@/lib/supabase/types";
import {
  Home,
  Loader2,
  Target,
  Flame,
  Check,
  ArrowRight,
  BookOpen,
  Sparkles,
  MessageCircle,
  BarChart3,
  ChevronRight,
  Sun,
  Moon,
  Sunset,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Habit {
  id: string;
  name: string;
  emoji: string;
  coach_id: string | null;
  streak: number;
  completedToday: boolean;
}

interface Goal {
  id: string;
  title: string;
  coach_id: string;
  progress: number;
  status: string;
  domain: string;
}

interface Recommendation {
  coach_id: string;
  name: string;
  accent_color: string;
  domain: string;
  reason: string;
  priority: number;
  type: string;
}

interface InsightsData {
  stats: {
    totalSessions: number;
    hoursCoached: number;
    streak: number;
    coachesActive: number;
    activeGoals: number;
    completedGoals: number;
    journalEntries: number;
  };
  moodTrend: Array<{ date: string; value: number; mood: string }>;
}

function getGreeting(): { text: string; icon: typeof Sun } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good morning", icon: Sun };
  if (hour < 17) return { text: "Good afternoon", icon: Sunset };
  return { text: "Good evening", icon: Moon };
}

export default function HomePage() {
  const profile = useAppStore((s) => s.profile);
  const roster = useAppStore((s) => s.roster);
  const coaches = COACHES as unknown as Coach[];

  const [loading, setLoading] = useState(true);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [todayMood, setTodayMood] = useState<string | null>(null);
  const [moodStreak, setMoodStreak] = useState(0);

  const load = useCallback(async () => {
    try {
      const [habitsRes, goalsRes, recsRes, insightsRes, moodRes, journalStatsRes] =
        await Promise.all([
          fetch("/api/habits").then((r) => (r.ok ? r.json() : { habits: [] })),
          fetch("/api/goals").then((r) => (r.ok ? r.json() : { goals: [] })),
          fetch("/api/recommendations").then((r) => (r.ok ? r.json() : { recommendations: [] })),
          fetch("/api/insights").then((r) => (r.ok ? r.json() : null)),
          fetch("/api/journal?type=moods&days=1").then((r) => (r.ok ? r.json() : { moods: [] })),
          fetch("/api/journal?type=stats").then((r) => (r.ok ? r.json() : { stats: {} })),
        ]);

      setHabits(habitsRes.habits || []);
      setGoals((goalsRes.goals || []).filter((g: Goal) => g.status === "active"));
      setRecommendations((recsRes.recommendations || []).slice(0, 3));
      setInsights(insightsRes);
      setMoodStreak(journalStatsRes.stats?.streak || 0);

      // Check today's mood
      const todayMoods = moodRes.moods || [];
      if (todayMoods.length > 0) {
        setTodayMood(todayMoods[todayMoods.length - 1].mood);
      }
    } catch {
      // Non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleHabit = useCallback(
    async (habitId: string) => {
      setHabits((prev) =>
        prev.map((h) =>
          h.id === habitId
            ? { ...h, completedToday: !h.completedToday, streak: !h.completedToday ? h.streak + 1 : Math.max(0, h.streak - 1) }
            : h
        )
      );
      try {
        await fetch("/api/habits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "toggle", habitId }),
        });
      } catch {
        load();
      }
    },
    [load]
  );

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;
  const displayName = profile?.display_name?.split(" ")[0] || "there";
  const completedHabits = habits.filter((h) => h.completedToday).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-ember mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Preparing your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
          <GreetingIcon className="w-8 h-8 text-ember" />
          {greeting.text}, {displayName}
        </h1>
        <p className="text-muted-foreground text-sm">
          {roster.length === 0
            ? "Start by adding coaches to your squad."
            : `You have ${roster.length} coach${roster.length !== 1 ? "es" : ""} on your squad.`}
        </p>
      </div>

      {/* Quick Stats Row */}
      {insights && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Link href="/insights" className="rounded-xl border border-border/50 bg-card p-4 text-center hover:border-border transition-colors">
            <p className="text-2xl font-bold">{insights.stats.totalSessions}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sessions</p>
          </Link>
          <Link href="/insights" className="rounded-xl border border-border/50 bg-card p-4 text-center hover:border-border transition-colors">
            <p className="text-2xl font-bold">{insights.stats.hoursCoached}h</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Coached</p>
          </Link>
          <Link href="/goals" className="rounded-xl border border-border/50 bg-card p-4 text-center hover:border-border transition-colors">
            <p className="text-2xl font-bold">{insights.stats.activeGoals}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Active Goals</p>
          </Link>
          <Link href="/journal" className="rounded-xl border border-border/50 bg-card p-4 text-center hover:border-border transition-colors">
            <p className="text-2xl font-bold flex items-center justify-center gap-1">
              {insights.stats.streak}
              {insights.stats.streak > 0 && <Flame className="w-4 h-4 text-ember" />}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Journal Streak</p>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Mood Check-In */}
          <MoodCheckIn
            todayMood={todayMood}
            streak={moodStreak}
            onMoodLogged={(mood) => setTodayMood(mood)}
          />

          {/* Today's Habits */}
          {habits.length > 0 && (
            <div className="rounded-2xl border border-border/50 bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Flame className="w-4 h-4 text-ember" />
                  Today&apos;s Habits
                </h3>
                <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                  {completedHabits}/{habits.length}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-secondary rounded-full mb-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-ember to-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${habits.length > 0 ? (completedHabits / habits.length) * 100 : 0}%` }}
                />
              </div>

              <div className="space-y-1">
                {habits.slice(0, 5).map((habit) => (
                  <button
                    key={habit.id}
                    onClick={() => handleToggleHabit(habit.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                      habit.completedToday
                        ? "bg-green-50 dark:bg-green-900/10"
                        : "hover:bg-secondary"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center text-xs transition-all ${
                        habit.completedToday
                          ? "bg-green-500 text-white"
                          : "border border-border"
                      }`}
                    >
                      {habit.completedToday && <Check className="w-3 h-3" />}
                    </div>
                    <span
                      className={`text-sm flex-1 ${
                        habit.completedToday ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {habit.emoji} {habit.name}
                    </span>
                    {habit.streak > 0 && (
                      <span className="text-[10px] text-ember font-medium">{habit.streak}d</span>
                    )}
                  </button>
                ))}
                {habits.length > 5 && (
                  <Link
                    href="/habits"
                    className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground hover:text-ember pt-1 transition-colors"
                  >
                    +{habits.length - 5} more <ChevronRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Active Goals */}
          {goals.length > 0 && (
            <div className="rounded-2xl border border-border/50 bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Target className="w-4 h-4 text-ember" />
                  Active Goals
                </h3>
                <Link
                  href="/goals"
                  className="text-[10px] text-muted-foreground hover:text-ember transition-colors"
                >
                  View all <ChevronRight className="w-3 h-3 inline" />
                </Link>
              </div>
              <div className="space-y-3">
                {goals.slice(0, 3).map((goal) => {
                  const coach = coaches.find((c) => c.id === goal.coach_id);
                  return (
                    <div key={goal.id} className="flex items-center gap-3">
                      {coach && (
                        <CoachAvatarSmall
                          name={coach.name}
                          accentColor={coach.accent_color || "#e8633b"}
                          size={28}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{goal.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-ember rounded-full transition-all"
                              style={{ width: `${goal.progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground font-medium">
                            {goal.progress}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Top Recommendation */}
          {recommendations.length > 0 && (
            <div className="rounded-2xl border border-border/50 bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-ember" />
                  Suggested Next
                </h3>
                <Link
                  href="/recommendations"
                  className="text-[10px] text-muted-foreground hover:text-ember transition-colors"
                >
                  See all <ChevronRight className="w-3 h-3 inline" />
                </Link>
              </div>
              <div className="space-y-2">
                {recommendations.map((rec) => {
                  const href =
                    rec.type === "discover"
                      ? `/coach/${rec.coach_id}`
                      : rec.type === "intake"
                        ? `/coach/${rec.coach_id}/intake`
                        : `/coach/${rec.coach_id}/chat`;

                  return (
                    <Link
                      key={rec.coach_id}
                      href={href}
                      className="group flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors"
                    >
                      <CoachAvatarSmall
                        name={rec.name}
                        accentColor={rec.accent_color}
                        size={36}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{rec.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{rec.reason}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-ember transition-colors shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Your Squad */}
          {roster.length > 0 && (
            <div className="rounded-2xl border border-border/50 bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-ember" />
                  Your Squad
                </h3>
                <Link
                  href="/roster"
                  className="text-[10px] text-muted-foreground hover:text-ember transition-colors"
                >
                  Manage <ChevronRight className="w-3 h-3 inline" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {roster.slice(0, 6).map((r) => {
                  const coach = coaches.find((c) => c.id === r.coach_id);
                  if (!coach) return null;
                  return (
                    <Link
                      key={r.coach_id}
                      href={`/coach/${r.coach_id}/chat`}
                      className="group flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-secondary transition-colors"
                    >
                      <CoachAvatarSmall
                        name={coach.name}
                        accentColor={coach.accent_color || "#e8633b"}
                        size={32}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{coach.name.split(" ")[0]}</p>
                        <p className="text-[10px] text-muted-foreground capitalize truncate">
                          {coach.domain.replace("_", " ")}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="rounded-2xl border border-border/50 bg-card p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-ember" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/journal"
                className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <BookOpen className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium">Write in Journal</span>
              </Link>
              <Link
                href="/discover"
                className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <Sparkles className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium">Discover Coaches</span>
              </Link>
              <Link
                href="/weekly-review"
                className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium">Weekly Review</span>
              </Link>
              <Link
                href="/habits"
                className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <Flame className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium">Manage Habits</span>
              </Link>
            </div>
          </div>

          {/* Empty state for new users */}
          {roster.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border/60 bg-card/50 p-8 text-center">
              <Home className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium mb-1">Welcome to CoachSquad</p>
              <p className="text-[11px] text-muted-foreground mb-4">
                Build your personal coaching team. Start by discovering coaches who match your goals.
              </p>
              <Button asChild size="sm" className="bg-ember hover:bg-ember/90 text-white">
                <Link href="/discover">Browse Coaches</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
