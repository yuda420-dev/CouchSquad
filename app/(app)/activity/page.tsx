"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/lib/stores/app-store";
import { COACHES } from "@/lib/coaches/catalog";
import { CoachAvatarSmall } from "@/components/coach-avatar";
import {
  Dumbbell,
  Apple,
  Brain,
  DollarSign,
  Plus,
  Loader2,
  Trash2,
  Activity,
  Clock,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Coach } from "@/lib/supabase/types";
import type { ActivityLog } from "@/lib/supabase/activity-logs";

const ACTIVITY_TYPES = [
  { value: "workout", label: "Workout", icon: Dumbbell, color: "text-red-500" },
  { value: "meal", label: "Meal", icon: Apple, color: "text-green-500" },
  { value: "meditation", label: "Meditation", icon: Brain, color: "text-purple-500" },
  { value: "budget", label: "Budget", icon: DollarSign, color: "text-emerald-500" },
  { value: "habit", label: "Habit", icon: Flame, color: "text-orange-500" },
] as const;

const ACTIVITY_ICON_MAP: Record<string, typeof Dumbbell> = {
  workout: Dumbbell,
  meal: Apple,
  meditation: Brain,
  budget: DollarSign,
  habit: Flame,
};

export default function ActivityPage() {
  const roster = useAppStore((s) => s.roster);
  const coaches = COACHES as unknown as Coach[];
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<{ totalLogs: number; thisWeek: number; byType: Record<string, number> } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<string | "all">("all");

  // Form state
  const [formCoach, setFormCoach] = useState("");
  const [formType, setFormType] = useState("workout");
  const [formTitle, setFormTitle] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [logsRes, statsRes] = await Promise.all([
        fetch(`/api/activity${filterType !== "all" ? `?activityType=${filterType}` : ""}`),
        fetch("/api/activity?stats=true"),
      ]);

      if (logsRes.ok) {
        const { logs: l } = await logsRes.json();
        setLogs(l || []);
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
  }, [filterType]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSubmit() {
    if (!formCoach || !formTitle.trim()) return;
    setSaving(true);

    try {
      const res = await fetch("/api/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "log",
          coachId: formCoach,
          activityType: formType,
          title: formTitle.trim(),
          data: formData,
          notes: formNotes.trim() || undefined,
        }),
      });

      if (res.ok) {
        setFormTitle("");
        setFormNotes("");
        setFormData({});
        setShowForm(false);
        loadData();
      }
    } catch {
      // Handle error
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(logId: string) {
    await fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", logId }),
    });
    setLogs((prev) => prev.filter((l) => l.id !== logId));
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Activity Log</h1>
        <div className="text-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading activities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
            <Activity className="w-8 h-8 text-ember" />
            Activity Log
          </h1>
          <p className="text-muted-foreground text-sm">
            Track workouts, meals, meditation, habits, and more.
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-ember hover:bg-ember/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" /> Log Activity
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-xl border border-border/50 bg-card p-4">
            <p className="text-2xl font-bold">{stats.totalLogs}</p>
            <p className="text-[10px] text-muted-foreground">Total Entries</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card p-4">
            <p className="text-2xl font-bold">{stats.thisWeek}</p>
            <p className="text-[10px] text-muted-foreground">This Week</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card p-4">
            <p className="text-2xl font-bold">{Object.keys(stats.byType).length}</p>
            <p className="text-[10px] text-muted-foreground">Activity Types</p>
          </div>
        </div>
      )}

      {/* New entry form */}
      {showForm && (
        <div className="rounded-xl border border-ember/20 bg-card p-5 mb-6">
          <h3 className="font-semibold text-sm mb-4">New Activity</h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Coach select */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Coach</label>
              <select
                value={formCoach}
                onChange={(e) => setFormCoach(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Select coach...</option>
                {roster.map((r) => {
                  const c = coaches.find((co) => co.id === r.coach_id);
                  return c ? (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ) : null;
                })}
              </select>
            </div>

            {/* Activity type */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
              <div className="flex gap-1.5">
                {ACTIVITY_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setFormType(t.value)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      formType === t.value
                        ? "bg-ember/10 text-ember border border-ember/30"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <t.icon className="w-3 h-3" />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="mb-3">
            <Input
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder={
                formType === "workout"
                  ? "Upper body push day"
                  : formType === "meal"
                  ? "Grilled chicken and rice"
                  : formType === "meditation"
                  ? "Morning breathing session"
                  : formType === "budget"
                  ? "Weekly expense review"
                  : "Daily reading habit"
              }
            />
          </div>

          {/* Domain-specific quick fields */}
          {formType === "workout" && (
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="text-[10px] text-muted-foreground mb-0.5 block">Duration (min)</label>
                <Input
                  type="number"
                  value={formData.duration_minutes || ""}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                  placeholder="45"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-0.5 block">Type</label>
                <select
                  value={formData.type || "strength"}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="strength">Strength</option>
                  <option value="cardio">Cardio</option>
                  <option value="hiit">HIIT</option>
                  <option value="yoga">Yoga</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-0.5 block">Intensity</label>
                <select
                  value={formData.intensity || "moderate"}
                  onChange={(e) => setFormData({ ...formData, intensity: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="low">Low</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High</option>
                  <option value="max">Max</option>
                </select>
              </div>
            </div>
          )}

          {formType === "meal" && (
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="text-[10px] text-muted-foreground mb-0.5 block">Meal</label>
                <select
                  value={formData.meal_type || "lunch"}
                  onChange={(e) => setFormData({ ...formData, meal_type: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-0.5 block">Calories (est.)</label>
                <Input
                  type="number"
                  value={formData.total_calories || ""}
                  onChange={(e) => setFormData({ ...formData, total_calories: parseInt(e.target.value) || 0 })}
                  placeholder="500"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-0.5 block">Quality</label>
                <select
                  value={formData.quality || "good"}
                  onChange={(e) => setFormData({ ...formData, quality: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="great">Great</option>
                  <option value="good">Good</option>
                  <option value="okay">Okay</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
            </div>
          )}

          {formType === "meditation" && (
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[10px] text-muted-foreground mb-0.5 block">Duration (min)</label>
                <Input
                  type="number"
                  value={formData.duration_minutes || ""}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                  placeholder="10"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-0.5 block">Focus Quality (1-5)</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setFormData({ ...formData, focus_quality: n })}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        formData.focus_quality === n
                          ? "bg-purple-500 text-white"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="mb-4">
            <Textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Notes (optional)..."
              className="min-h-[60px] resize-none"
              rows={2}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={!formCoach || !formTitle.trim() || saving}
              className="bg-ember hover:bg-ember/90 text-white"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Entry
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Filter pills */}
      <div className="flex gap-1.5 mb-4">
        <button
          onClick={() => setFilterType("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            filterType === "all"
              ? "bg-ember/10 text-ember"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          All
        </button>
        {ACTIVITY_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setFilterType(t.value)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filterType === t.value
                ? "bg-ember/10 text-ember"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <t.icon className="w-3 h-3" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Activity list */}
      {logs.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-border/50">
          <Activity className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm mb-2">
            No activities logged yet
          </p>
          <p className="text-xs text-muted-foreground/60">
            Start tracking workouts, meals, and habits to see your progress.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => {
            const coach = coaches.find((c) => c.id === log.coach_id);
            const Icon = ACTIVITY_ICON_MAP[log.activity_type] || Activity;

            return (
              <div
                key={log.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card group"
              >
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{log.title}</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                      {log.activity_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                    {coach && <span>{coach.name}</span>}
                    {log.data?.duration_minutes && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {log.data.duration_minutes}min
                        </span>
                      </>
                    )}
                    {log.data?.intensity && (
                      <>
                        <span>·</span>
                        <span className="capitalize">{log.data.intensity}</span>
                      </>
                    )}
                    {log.data?.total_calories && (
                      <>
                        <span>·</span>
                        <span>{log.data.total_calories} cal</span>
                      </>
                    )}
                    {log.notes && (
                      <>
                        <span>·</span>
                        <span className="truncate max-w-[200px]">{log.notes}</span>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground shrink-0">
                  {formatRelativeTime(log.created_at)}
                </p>
                <button
                  onClick={() => handleDelete(log.id)}
                  className="p-1.5 rounded-lg text-muted-foreground/30 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
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
