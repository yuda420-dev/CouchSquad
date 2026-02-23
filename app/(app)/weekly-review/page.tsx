"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { CoachAvatarSmall } from "@/components/coach-avatar";
import {
  CalendarDays,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  MessageCircle,
  Brain,
  BookOpen,
  Dumbbell,
  ArrowRight,
} from "lucide-react";

interface WeeklyReview {
  weekOf: string;
  sessions: { thisWeek: number; lastWeek: number; delta: number };
  mood: {
    direction: "improving" | "declining" | "stable";
    average: number | null;
    entries: number;
    data: { mood: string; date: string }[];
  };
  goals: { active: number; completedThisWeek: number; updatedThisWeek: number };
  topCoach: {
    id: string;
    name: string;
    accent_color: string;
    sessions: number;
  } | null;
  coachSummaries: {
    coach_id: string;
    name: string;
    accent_color: string;
    domain: string;
    sessions: number;
    newMemories: number;
    goalsUpdated: number;
    topMemory: string | null;
  }[];
  journal: { entries: number; titles: string[] };
  activities: Record<string, number>;
  memories: {
    total: number;
    highlights: { coach_id: string; text: string; category: string }[];
  };
}

const MOOD_EMOJI: Record<string, string> = {
  great: "😊",
  good: "🙂",
  okay: "😐",
  low: "😔",
  bad: "😢",
};

export default function WeeklyReviewPage() {
  const [review, setReview] = useState<WeeklyReview | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/weekly-review");
      if (res.ok) {
        setReview(await res.json());
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

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Weekly Review</h1>
        <div className="text-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Generating your weekly review...
          </p>
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Weekly Review</h1>
        <p className="text-muted-foreground">Could not load review.</p>
      </div>
    );
  }

  const weekLabel = new Date(review.weekOf).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const nowLabel = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
          <CalendarDays className="w-8 h-8 text-ember" />
          Weekly Review
        </h1>
        <p className="text-muted-foreground text-sm">
          {weekLabel} &mdash; {nowLabel} &middot; Your State of You
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard
          label="Sessions"
          value={review.sessions.thisWeek}
          delta={review.sessions.delta}
          icon={<MessageCircle className="w-4 h-4" />}
        />
        <StatCard
          label="Mood"
          value={
            review.mood.average !== null
              ? review.mood.average.toFixed(1)
              : "--"
          }
          suffix="/5"
          direction={review.mood.direction}
          icon={
            review.mood.direction === "improving" ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : review.mood.direction === "declining" ? (
              <TrendingDown className="w-4 h-4 text-red-500" />
            ) : (
              <Minus className="w-4 h-4 text-muted-foreground" />
            )
          }
        />
        <StatCard
          label="Goals Completed"
          value={review.goals.completedThisWeek}
          icon={<Target className="w-4 h-4" />}
        />
        <StatCard
          label="New Memories"
          value={review.memories.total}
          icon={<Brain className="w-4 h-4" />}
        />
      </div>

      {/* Mood Timeline */}
      {review.mood.data.length > 0 && (
        <section className="rounded-xl border border-border/50 bg-card p-5 mb-6">
          <h2 className="text-sm font-semibold mb-3">Mood This Week</h2>
          <div className="flex items-end gap-1.5">
            {review.mood.data.map((m, i) => {
              const day = new Date(m.date).toLocaleDateString("en-US", {
                weekday: "short",
              });
              return (
                <div
                  key={i}
                  className="flex flex-col items-center gap-1 flex-1"
                >
                  <span className="text-lg">{MOOD_EMOJI[m.mood] || "😐"}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {day}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Top Coach */}
      {review.topCoach && (
        <section className="rounded-xl border border-border/50 bg-card p-5 mb-6">
          <h2 className="text-sm font-semibold mb-3">Most Active Coach</h2>
          <Link
            href={`/coach/${review.topCoach.id}/chat`}
            className="flex items-center gap-3 group"
          >
            <CoachAvatarSmall
              name={review.topCoach.name}
              accentColor={review.topCoach.accent_color}
              size={40}
            />
            <div className="flex-1">
              <p className="text-sm font-medium group-hover:text-ember transition-colors">
                {review.topCoach.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {review.topCoach.sessions} session
                {review.topCoach.sessions !== 1 && "s"} this week
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-ember transition-colors" />
          </Link>
        </section>
      )}

      {/* Coach-by-coach breakdown */}
      {review.coachSummaries.length > 0 && (
        <section className="rounded-xl border border-border/50 bg-card p-5 mb-6">
          <h2 className="text-sm font-semibold mb-3">Coach Activity</h2>
          <div className="space-y-3">
            {review.coachSummaries.map((cs) => (
              <div key={cs.coach_id} className="flex items-start gap-3">
                <CoachAvatarSmall
                  name={cs.name}
                  accentColor={cs.accent_color}
                  size={32}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{cs.name}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      {cs.sessions} session{cs.sessions !== 1 && "s"}
                    </span>
                    {cs.newMemories > 0 && (
                      <span>{cs.newMemories} new memories</span>
                    )}
                    {cs.goalsUpdated > 0 && (
                      <span>{cs.goalsUpdated} goals updated</span>
                    )}
                  </div>
                  {cs.topMemory && (
                    <p className="text-xs text-muted-foreground/70 mt-1 italic truncate">
                      &ldquo;{cs.topMemory}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Journal entries */}
      {review.journal.entries > 0 && (
        <section className="rounded-xl border border-border/50 bg-card p-5 mb-6">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Journal ({review.journal.entries} entries)
          </h2>
          <ul className="space-y-1">
            {review.journal.titles.map((title, i) => (
              <li
                key={i}
                className="text-sm text-muted-foreground truncate"
              >
                {title || "Untitled entry"}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Activities */}
      {Object.keys(review.activities).length > 0 && (
        <section className="rounded-xl border border-border/50 bg-card p-5 mb-6">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Dumbbell className="w-4 h-4" />
            Activities Logged
          </h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(review.activities).map(([type, count]) => (
              <span
                key={type}
                className="text-xs px-2.5 py-1 rounded-full bg-secondary text-muted-foreground"
              >
                {type}: {count}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Memory highlights */}
      {review.memories.highlights.length > 0 && (
        <section className="rounded-xl border border-border/50 bg-card p-5">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Brain className="w-4 h-4" />
            New Things Your Coaches Learned
          </h2>
          <ul className="space-y-2">
            {review.memories.highlights.map((m, i) => (
              <li key={i} className="text-sm text-muted-foreground">
                <span className="text-foreground font-medium">
                  {m.category}:
                </span>{" "}
                {m.text}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
  delta,
  direction,
  icon,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  delta?: number;
  direction?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-4">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold">{value}</span>
        {suffix && (
          <span className="text-sm text-muted-foreground">{suffix}</span>
        )}
      </div>
      {delta !== undefined && delta !== 0 && (
        <p
          className={`text-[10px] mt-1 ${delta > 0 ? "text-green-500" : "text-red-500"}`}
        >
          {delta > 0 ? "+" : ""}
          {delta}% vs last week
        </p>
      )}
      {direction && (
        <p
          className={`text-[10px] mt-1 capitalize ${
            direction === "improving"
              ? "text-green-500"
              : direction === "declining"
                ? "text-red-500"
                : "text-muted-foreground"
          }`}
        >
          {direction}
        </p>
      )}
    </div>
  );
}
