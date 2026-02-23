"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/lib/stores/app-store";
import { COACHES } from "@/lib/coaches/catalog";
import { CoachAvatarSmall } from "@/components/coach-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Target,
  Plus,
  Check,
  Circle,
  ChevronDown,
  ChevronRight,
  Calendar,
  TrendingUp,
  Loader2,
  Sparkles,
  Pause,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import type { Coach } from "@/lib/supabase/types";

interface GoalData {
  id: string;
  coach_id: string;
  title: string;
  description: string | null;
  domain: string;
  status: "active" | "completed" | "paused" | "abandoned";
  target_date: string | null;
  progress: number;
  created_at: string;
  milestones: MilestoneData[];
}

interface MilestoneData {
  id: string;
  title: string;
  completed_at: string | null;
  sort_order: number;
}

const STATUS_CONFIG = {
  active: { label: "Active", icon: TrendingUp, className: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
  completed: { label: "Complete", icon: Trophy, className: "bg-amber-500/10 text-amber-600 border-amber-200" },
  paused: { label: "Paused", icon: Pause, className: "bg-gray-500/10 text-gray-600 border-gray-200" },
  abandoned: { label: "Dropped", icon: Circle, className: "bg-red-500/10 text-red-600 border-red-200" },
};

export default function GoalsPage() {
  const roster = useAppStore((s) => s.roster);
  const coaches = COACHES as unknown as Coach[];
  const [goals, setGoals] = useState<GoalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  // Stats
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, avgProgress: 0 });

  const loadGoals = useCallback(async () => {
    try {
      const [goalsRes, statsRes] = await Promise.all([
        fetch("/api/goals"),
        fetch("/api/goals?stats=true"),
      ]);
      if (goalsRes.ok) {
        const { goals: g } = await goalsRes.json();
        setGoals(g || []);
      }
      if (statsRes.ok) {
        const { stats: s } = await statsRes.json();
        setStats(s);
      }
    } catch {
      // Non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const handleCreate = async (data: {
    coachId: string;
    title: string;
    description: string;
    domain: string;
    milestones: string[];
  }) => {
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          coachId: data.coachId,
          title: data.title,
          description: data.description,
          domain: data.domain,
          milestones: data.milestones.filter(Boolean).map((m) => ({ title: m })),
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        loadGoals();
      }
    } catch {
      // Handle error
    }
  };

  const handleToggleMilestone = async (milestoneId: string, isCompleted: boolean) => {
    try {
      await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isCompleted ? "uncomplete_milestone" : "complete_milestone",
          milestoneId,
        }),
      });
      loadGoals();
    } catch {
      // Handle error
    }
  };

  const handleUpdateProgress = async (goalId: string, progress: number) => {
    try {
      await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          goalId,
          updates: { progress, ...(progress >= 100 ? { status: "completed" } : {}) },
        }),
      });
      loadGoals();
    } catch {
      // Handle error
    }
  };

  const filteredGoals =
    filter === "all"
      ? goals
      : goals.filter((g) => (filter === "active" ? g.status === "active" : g.status === "completed"));

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Target className="w-8 h-8 text-ember" />
            Goals
          </h1>
          <p className="text-muted-foreground">
            Set goals with your coaches and track progress toward what matters.
          </p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-ember hover:bg-ember/90 text-white"
          disabled={roster.length === 0}
        >
          <Plus className="w-4 h-4 mr-2" /> New Goal
        </Button>
      </div>

      {/* Stats row */}
      {stats.total > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          <StatCard label="Total Goals" value={stats.total} />
          <StatCard label="Active" value={stats.active} color="text-emerald-600" />
          <StatCard label="Completed" value={stats.completed} color="text-amber-600" />
          <StatCard label="Avg Progress" value={`${stats.avgProgress}%`} color="text-blue-600" />
        </div>
      )}

      {/* Filter pills */}
      {goals.length > 0 && (
        <div className="flex gap-2 mb-6">
          {(["all", "active", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-ember text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {f === "all" ? "All" : f === "active" ? "Active" : "Completed"}
            </button>
          ))}
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <CreateGoalForm
          coaches={coaches}
          roster={roster}
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {/* Goals list */}
      {loading ? (
        <div className="text-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading goals...</p>
        </div>
      ) : goals.length === 0 ? (
        <EmptyGoals hasRoster={roster.length > 0} onCreateClick={() => setShowCreate(true)} />
      ) : filteredGoals.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No {filter} goals found.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGoals.map((goal) => {
            const coach = coaches.find((c) => c.id === goal.coach_id);
            const isExpanded = expandedGoal === goal.id;
            const config = STATUS_CONFIG[goal.status];
            const completedMilestones = goal.milestones.filter((m) => m.completed_at).length;
            const totalMilestones = goal.milestones.length;

            return (
              <div
                key={goal.id}
                className="rounded-xl border border-border/60 bg-card overflow-hidden transition-shadow hover:shadow-sm"
              >
                {/* Goal header */}
                <button
                  onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
                  className="w-full flex items-center gap-3 p-4 text-left"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedGoal(isExpanded ? null : goal.id);
                    }}
                    className="shrink-0 text-muted-foreground"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>

                  {coach && (
                    <CoachAvatarSmall
                      name={coach.name}
                      accentColor={coach.accent_color || "#e8633b"}
                      size={28}
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-sm truncate">{goal.title}</h3>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${config.className}`}>
                        {config.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {coach && <span>{coach.name}</span>}
                      {goal.target_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(goal.target_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                      {totalMilestones > 0 && (
                        <span>{completedMilestones}/{totalMilestones} milestones</span>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-24 shrink-0">
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold">{goal.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all bg-ember"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 border-t border-border/40">
                    {goal.description && (
                      <p className="text-sm text-muted-foreground mt-3 mb-4">{goal.description}</p>
                    )}

                    {/* Milestones */}
                    {goal.milestones.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          Milestones
                        </h4>
                        <div className="space-y-1.5">
                          {goal.milestones
                            .sort((a, b) => a.sort_order - b.sort_order)
                            .map((ms) => (
                              <button
                                key={ms.id}
                                onClick={() => handleToggleMilestone(ms.id, !!ms.completed_at)}
                                className="flex items-center gap-2.5 w-full text-left group py-1"
                              >
                                <div
                                  className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                    ms.completed_at
                                      ? "bg-emerald-500 border-emerald-500 text-white"
                                      : "border-border group-hover:border-emerald-400"
                                  }`}
                                >
                                  {ms.completed_at && <Check className="w-3 h-3" />}
                                </div>
                                <span
                                  className={`text-sm ${
                                    ms.completed_at
                                      ? "line-through text-muted-foreground"
                                      : "text-foreground"
                                  }`}
                                >
                                  {ms.title}
                                </span>
                              </button>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Progress update */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">Update progress:</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={goal.progress}
                        onChange={(e) => handleUpdateProgress(goal.id, parseInt(e.target.value))}
                        className="flex-1 accent-ember h-1.5"
                      />
                      <span className="text-xs font-semibold w-8 text-right">{goal.progress}%</span>
                    </div>

                    {/* Quick actions */}
                    <div className="flex gap-2 mt-3 pt-3 border-t border-border/30">
                      {coach && (
                        <Link href={`/coach/${coach.id}/chat`}>
                          <Button variant="ghost" size="sm" className="text-xs h-7 text-ember hover:text-ember/80">
                            <Sparkles className="w-3 h-3 mr-1" /> Discuss with {coach.name.split(" ")[0]}
                          </Button>
                        </Link>
                      )}
                      {goal.status === "active" && goal.progress >= 100 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 text-emerald-600 hover:text-emerald-700"
                          onClick={() => handleUpdateProgress(goal.id, 100)}
                        >
                          <Trophy className="w-3 h-3 mr-1" /> Mark Complete
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-3">
      <p className={`text-xl font-bold ${color || ""}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function EmptyGoals({ hasRoster, onCreateClick }: { hasRoster: boolean; onCreateClick: () => void }) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 rounded-2xl bg-ember/10 flex items-center justify-center mx-auto mb-4">
        <Target className="w-8 h-8 text-ember" />
      </div>
      <h2 className="text-xl font-semibold mb-2">No goals yet</h2>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
        {hasRoster
          ? "Set a goal with one of your coaches to start tracking your progress."
          : "Add coaches to your squad first, then set goals together."}
      </p>
      {hasRoster ? (
        <Button onClick={onCreateClick} className="bg-ember hover:bg-ember/90 text-white">
          <Plus className="w-4 h-4 mr-2" /> Set Your First Goal
        </Button>
      ) : (
        <Link href="/discover">
          <Button className="bg-ember hover:bg-ember/90 text-white">Browse Coaches</Button>
        </Link>
      )}
    </div>
  );
}

function CreateGoalForm({
  coaches,
  roster,
  onSubmit,
  onCancel,
}: {
  coaches: Coach[];
  roster: { coach_id: string }[];
  onSubmit: (data: { coachId: string; title: string; description: string; domain: string; milestones: string[] }) => void;
  onCancel: () => void;
}) {
  const [coachId, setCoachId] = useState(roster[0]?.coach_id || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [milestones, setMilestones] = useState(["", "", ""]);

  const selectedCoach = coaches.find((c) => c.id === coachId);

  return (
    <div className="rounded-xl border border-ember/20 bg-card p-5 mb-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-ember" /> New Goal
      </h3>

      <div className="space-y-4">
        {/* Coach selector */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Coach</label>
          <select
            value={coachId}
            onChange={(e) => setCoachId(e.target.value)}
            className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm"
          >
            {roster.map((r) => {
              const c = coaches.find((co) => co.id === r.coach_id);
              return c ? (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.sub_domain || c.domain}
                </option>
              ) : null;
            })}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Goal</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Run a half marathon, Build emergency fund, Meditate daily"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Why this matters <span className="text-muted-foreground/50">(optional)</span>
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's motivating you? Why now?"
            rows={2}
          />
        </div>

        {/* Milestones */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Milestones <span className="text-muted-foreground/50">(optional)</span>
          </label>
          <div className="space-y-2">
            {milestones.map((ms, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full border-2 border-border shrink-0" />
                <Input
                  value={ms}
                  onChange={(e) => {
                    const next = [...milestones];
                    next[i] = e.target.value;
                    setMilestones(next);
                  }}
                  placeholder={`Step ${i + 1}`}
                  className="h-8 text-sm"
                />
              </div>
            ))}
            <button
              onClick={() => setMilestones([...milestones, ""])}
              className="text-xs text-ember hover:text-ember/80 flex items-center gap-1 ml-7"
            >
              <Plus className="w-3 h-3" /> Add milestone
            </button>
          </div>
        </div>

        {/* Actions */}
        <Separator />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-ember hover:bg-ember/90 text-white"
            disabled={!title.trim() || !coachId}
            onClick={() =>
              onSubmit({
                coachId,
                title: title.trim(),
                description: description.trim(),
                domain: selectedCoach?.domain || "general",
                milestones: milestones.filter(Boolean),
              })
            }
          >
            <Target className="w-3.5 h-3.5 mr-1.5" /> Create Goal
          </Button>
        </div>
      </div>
    </div>
  );
}
