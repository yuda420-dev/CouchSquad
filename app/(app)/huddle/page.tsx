"use client";

import { useState, useEffect, useCallback } from "react";
import { COACHES } from "@/lib/coaches/catalog";
import { CoachAvatarSmall } from "@/components/coach-avatar";
import {
  Handshake,
  Brain,
  MessageCircle,
  Target,
  Loader2,
  ArrowRight,
  BookOpen,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import type { Coach } from "@/lib/supabase/types";

interface CoachSummary {
  coach_id: string;
  name: string;
  domain: string;
  sub_domain: string;
  accent_color: string;
  intake_completed: boolean;
  memories: { fact: string; category: string; importance: number }[];
  memory_count: number;
  goals: { title: string; status: string; progress: number }[];
  sessions: number;
  total_messages: number;
  last_active: string | null;
}

interface CrossCoachTheme {
  keyword: string;
  coaches: string[];
  example_facts: string[];
}

interface CrossCoachJournal {
  preview: string;
  mood: string;
  coach_tags: string[];
  created_at: string;
}

interface HuddleData {
  coachSummaries: CoachSummary[];
  crossCoachThemes: CrossCoachTheme[];
  crossCoachJournals: CrossCoachJournal[];
  overview: {
    totalCoaches: number;
    totalMemories: number;
    totalGoals: number;
    activeGoals: number;
    domains: string[];
  };
}

export default function HuddlePage() {
  const coaches = COACHES as unknown as Coach[];
  const [data, setData] = useState<HuddleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCoach, setSelectedCoach] = useState<string | null>(null);

  const loadHuddle = useCallback(async () => {
    try {
      const res = await fetch("/api/huddle");
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
    loadHuddle();
  }, [loadHuddle]);

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">The Huddle</h1>
        <div className="text-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Gathering insights from your squad...</p>
        </div>
      </div>
    );
  }

  const overview = data?.overview || {
    totalCoaches: 0,
    totalMemories: 0,
    totalGoals: 0,
    activeGoals: 0,
    domains: [],
  };
  const summaries = data?.coachSummaries || [];
  const themes = data?.crossCoachThemes || [];
  const journals = data?.crossCoachJournals || [];

  const selectedSummary = selectedCoach
    ? summaries.find((s) => s.coach_id === selectedCoach)
    : null;

  if (summaries.length === 0) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Handshake className="w-8 h-8 text-ember" />
            The Huddle
          </h1>
          <p className="text-muted-foreground text-sm">
            Your coaches coordinate here. Add coaches and start conversations to see insights.
          </p>
        </div>
        <div className="text-center py-16 rounded-xl border border-dashed border-border/50">
          <Handshake className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm mb-2">No coaches on your squad yet</p>
          <Link href="/discover" className="text-ember hover:text-ember/80 text-sm">
            Discover Coaches
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Handshake className="w-8 h-8 text-ember" />
          The Huddle
        </h1>
        <p className="text-muted-foreground text-sm">
          Your coaches share notes, spot patterns, and coordinate your growth across domains.
        </p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <p className="text-2xl font-bold">{overview.totalCoaches}</p>
          <p className="text-[10px] text-muted-foreground">Active Coaches</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <p className="text-2xl font-bold">{overview.totalMemories}</p>
          <p className="text-[10px] text-muted-foreground">Things Remembered</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <p className="text-2xl font-bold">{overview.activeGoals}</p>
          <p className="text-[10px] text-muted-foreground">Active Goals</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <p className="text-2xl font-bold">{overview.domains.length}</p>
          <p className="text-[10px] text-muted-foreground">Life Domains</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column — Coach summaries */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cross-coach themes */}
          {themes.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Patterns Across Coaches
              </h2>
              <div className="space-y-2">
                {themes.map((theme) => (
                  <div
                    key={theme.keyword}
                    className="rounded-xl border border-border/50 bg-card p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium capitalize">{theme.keyword}</span>
                      <span className="text-[10px] text-muted-foreground">
                        mentioned by {theme.coaches.join(", ")}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {theme.example_facts.map((fact, i) => (
                        <p key={i} className="text-xs text-muted-foreground leading-relaxed">
                          &ldquo;{fact}&rdquo;
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Coach cards */}
          <section>
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Brain className="w-4 h-4 text-muted-foreground" />
              What Each Coach Knows
            </h2>
            <div className="space-y-2">
              {summaries.map((summary) => {
                const coach = coaches.find((c) => c.id === summary.coach_id);
                const isSelected = selectedCoach === summary.coach_id;

                return (
                  <div key={summary.coach_id}>
                    <button
                      onClick={() =>
                        setSelectedCoach(isSelected ? null : summary.coach_id)
                      }
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${
                        isSelected
                          ? "border-ember/30 bg-ember/5"
                          : "border-border/50 bg-card hover:border-border/80"
                      }`}
                    >
                      <CoachAvatarSmall
                        name={summary.name}
                        accentColor={summary.accent_color}
                        size={36}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{summary.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {summary.sub_domain || summary.domain}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-right shrink-0">
                        <div>
                          <p className="text-sm font-semibold">{summary.memory_count}</p>
                          <p className="text-[10px] text-muted-foreground">memories</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{summary.total_messages}</p>
                          <p className="text-[10px] text-muted-foreground">messages</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{summary.goals.length}</p>
                          <p className="text-[10px] text-muted-foreground">goals</p>
                        </div>
                        <ArrowRight
                          className={`w-4 h-4 text-muted-foreground/40 transition-transform ${
                            isSelected ? "rotate-90" : ""
                          }`}
                        />
                      </div>
                    </button>

                    {/* Expanded detail */}
                    {isSelected && selectedSummary && (
                      <div className="mt-2 ml-12 mr-2 space-y-3 pb-2">
                        {/* Memories */}
                        {selectedSummary.memories.length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                              Top Memories
                            </p>
                            <div className="space-y-1">
                              {selectedSummary.memories.map((mem, i) => (
                                <div
                                  key={i}
                                  className="flex items-start gap-2 text-xs text-muted-foreground"
                                >
                                  <span
                                    className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full"
                                    style={{ backgroundColor: summary.accent_color }}
                                  />
                                  <span>{mem.fact}</span>
                                  <span className="shrink-0 text-[9px] text-muted-foreground/50 capitalize">
                                    {mem.category}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Goals */}
                        {selectedSummary.goals.length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                              Goals
                            </p>
                            <div className="space-y-1">
                              {selectedSummary.goals.map((goal, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-2 text-xs"
                                >
                                  <div
                                    className={`w-2 h-2 rounded-full ${
                                      goal.status === "active"
                                        ? "bg-emerald-500"
                                        : goal.status === "completed"
                                        ? "bg-amber-500"
                                        : "bg-muted-foreground/30"
                                    }`}
                                  />
                                  <span className="text-foreground">{goal.title}</span>
                                  <span className="text-muted-foreground/60">
                                    {goal.progress}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Activity */}
                        <div className="flex gap-4 pt-1">
                          <span className="text-[10px] text-muted-foreground">
                            {selectedSummary.sessions} sessions
                          </span>
                          {selectedSummary.last_active && (
                            <span className="text-[10px] text-muted-foreground">
                              Last active: {formatRelativeTime(selectedSummary.last_active)}
                            </span>
                          )}
                          <Link
                            href={`/coach/${selectedSummary.coach_id}/chat`}
                            className="text-[10px] text-ember hover:text-ember/80 ml-auto"
                          >
                            Open Chat
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right column — Cross-coach journals + insights */}
        <div className="space-y-6">
          {/* Cross-coach journal entries */}
          {journals.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-muted-foreground" />
                Multi-Coach Journals
              </h2>
              <div className="space-y-2">
                {journals.map((j, i) => {
                  const tagCoaches = j.coach_tags
                    .map((tag: string) => coaches.find((c) => c.id === tag))
                    .filter(Boolean) as Coach[];

                  return (
                    <div
                      key={i}
                      className="rounded-xl border border-border/50 bg-card p-4"
                    >
                      <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                        {j.preview}
                        {j.preview.length >= 150 && "..."}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1">
                          {tagCoaches.map((c) => (
                            <CoachAvatarSmall
                              key={c.id}
                              name={c.name}
                              accentColor={c.accent_color || "#e8633b"}
                              size={18}
                            />
                          ))}
                        </div>
                        <span className="text-[9px] text-muted-foreground">
                          {tagCoaches.map((c) => c.name.split(" ")[0]).join(", ")}
                        </span>
                        {j.mood && (
                          <span className="text-xs ml-auto">
                            {j.mood === "great"
                              ? "😊"
                              : j.mood === "good"
                              ? "🙂"
                              : j.mood === "okay"
                              ? "😐"
                              : j.mood === "low"
                              ? "😔"
                              : "😢"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <Link
                href="/journal"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2 px-1"
              >
                View all entries <ArrowRight className="w-3 h-3" />
              </Link>
            </section>
          )}

          {/* Domains covered */}
          <section>
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              Domains Covered
            </h2>
            <div className="rounded-xl border border-border/50 bg-card p-4">
              {overview.domains.length === 0 ? (
                <p className="text-xs text-muted-foreground">No domains yet</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {overview.domains.map((domain) => (
                    <span
                      key={domain}
                      className="px-2.5 py-1 rounded-full bg-muted text-xs font-medium"
                    >
                      {domain}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Quick actions */}
          <div className="space-y-2">
            <Link
              href="/goals"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <Target className="w-4 h-4" /> View all goals
            </Link>
            <Link
              href="/insights"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <MessageCircle className="w-4 h-4" /> Insights dashboard
            </Link>
          </div>
        </div>
      </div>
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
