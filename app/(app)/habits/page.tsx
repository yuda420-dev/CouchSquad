"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/lib/stores/app-store";
import { CoachAvatarSmall } from "@/components/coach-avatar";
import {
  Flame,
  Loader2,
  Plus,
  Check,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COACHES } from "@/lib/coaches/catalog";
import type { Coach } from "@/lib/supabase/types";

interface Habit {
  id: string;
  name: string;
  emoji: string;
  coach_id: string | null;
  frequency: string;
  streak: number;
  completedToday: boolean;
  recentCompletions: string[];
}

const EMOJI_OPTIONS = ["✅", "💪", "🧘", "📚", "💧", "🥗", "🏃", "💤", "🧠", "💰"];

export default function HabitsPage() {
  const roster = useAppStore((s) => s.roster);
  const coaches = COACHES as unknown as Coach[];
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("✅");
  const [newCoachId, setNewCoachId] = useState<string>("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/habits");
      if (res.ok) {
        const data = await res.json();
        setHabits(data.habits || []);
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

  const handleToggle = useCallback(
    async (habitId: string) => {
      // Optimistic update
      setHabits((prev) =>
        prev.map((h) =>
          h.id === habitId
            ? {
                ...h,
                completedToday: !h.completedToday,
                streak: !h.completedToday ? h.streak + 1 : Math.max(0, h.streak - 1),
              }
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
        load(); // Revert
      }
    },
    [load]
  );

  const handleCreate = useCallback(async () => {
    if (!newName.trim()) return;

    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          name: newName.trim(),
          emoji: newEmoji,
          coachId: newCoachId || null,
        }),
      });

      if (res.ok) {
        setNewName("");
        setNewEmoji("✅");
        setNewCoachId("");
        setShowCreate(false);
        load();
      }
    } catch {
      // Non-critical
    }
  }, [newName, newEmoji, newCoachId, load]);

  const handleDelete = useCallback(
    async (habitId: string) => {
      setHabits((prev) => prev.filter((h) => h.id !== habitId));
      try {
        await fetch("/api/habits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete", habitId }),
        });
      } catch {
        load();
      }
    },
    [load]
  );

  // Generate week dates for the heatmap
  const weekDates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    weekDates.push(d.toISOString().slice(0, 10));
  }

  const totalCompletedToday = habits.filter((h) => h.completedToday).length;
  const longestStreak = Math.max(0, ...habits.map((h) => h.streak));

  const rosterCoaches = roster
    .map((r) => coaches.find((c) => c.id === r.coach_id))
    .filter(Boolean) as Coach[];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
            <Flame className="w-8 h-8 text-ember" />
            Habits
          </h1>
          <p className="text-muted-foreground text-sm">
            Daily habits with streak tracking. Your coaches hold you accountable.
          </p>
        </div>
        <Button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-ember hover:bg-ember/90 text-white"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-1" />
          New Habit
        </Button>
      </div>

      {/* Stats */}
      {habits.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-xl border border-border/50 bg-card p-4 text-center">
            <p className="text-2xl font-bold">
              {totalCompletedToday}/{habits.length}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Done Today
            </p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card p-4 text-center">
            <p className="text-2xl font-bold flex items-center justify-center gap-1">
              {longestStreak}
              {longestStreak > 0 && (
                <Flame className="w-5 h-5 text-ember" />
              )}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Best Streak
            </p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card p-4 text-center">
            <p className="text-2xl font-bold">
              {habits.length > 0
                ? Math.round(
                    (totalCompletedToday / habits.length) * 100
                  )
                : 0}
              %
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Completion
            </p>
          </div>
        </div>
      )}

      {/* Create habit form */}
      {showCreate && (
        <div className="rounded-xl border border-border bg-card p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex gap-1">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  onClick={() => setNewEmoji(e)}
                  className={`text-lg p-1 rounded transition-colors ${
                    newEmoji === e
                      ? "bg-ember/10 ring-1 ring-ember"
                      : "hover:bg-secondary"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Habit name (e.g., Meditate 10 min)"
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <select
              value={newCoachId}
              onChange={(e) => setNewCoachId(e.target.value)}
              className="h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="">No coach</option>
              {rosterCoaches.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name.split(" ")[0]}
                </option>
              ))}
            </select>
            <Button onClick={handleCreate} disabled={!newName.trim()}>
              Add
            </Button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="text-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading habits...</p>
        </div>
      ) : habits.length === 0 ? (
        <div className="text-center py-20">
          <Flame className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No habits yet.</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Create your first habit to start building streaks.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Week header */}
          <div className="flex items-center gap-2 px-14 mb-1">
            <div className="flex-1" />
            <div className="flex gap-1.5">
              {weekDates.map((d) => (
                <div
                  key={d}
                  className="w-7 text-center text-[9px] text-muted-foreground"
                >
                  {new Date(d + "T12:00:00").toLocaleDateString("en-US", {
                    weekday: "narrow",
                  })}
                </div>
              ))}
            </div>
            <div className="w-16" />
          </div>

          {/* Habit rows */}
          {habits.map((habit) => {
            const coach = habit.coach_id
              ? coaches.find((c) => c.id === habit.coach_id)
              : null;

            return (
              <div
                key={habit.id}
                className="group flex items-center gap-2 rounded-xl border border-border/30 bg-card px-3 py-2.5 hover:border-border/60 transition-colors"
              >
                {/* Toggle today */}
                <button
                  onClick={() => handleToggle(habit.id)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all ${
                    habit.completedToday
                      ? "bg-green-100 dark:bg-green-900/30 scale-110"
                      : "bg-secondary hover:bg-secondary/80"
                  }`}
                >
                  {habit.completedToday ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <span className="opacity-50">{habit.emoji}</span>
                  )}
                </button>

                {/* Name + coach */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      habit.completedToday
                        ? "text-muted-foreground line-through"
                        : ""
                    }`}
                  >
                    {habit.emoji} {habit.name}
                  </p>
                  {coach && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <CoachAvatarSmall
                        name={coach.name}
                        accentColor={coach.accent_color || "#e8633b"}
                        size={14}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {coach.name.split(" ")[0]}
                      </span>
                    </div>
                  )}
                </div>

                {/* Week heatmap */}
                <div className="flex gap-1.5">
                  {weekDates.map((d) => {
                    const isCompleted =
                      habit.recentCompletions.includes(d);
                    const isToday =
                      d === new Date().toISOString().slice(0, 10);
                    return (
                      <div
                        key={d}
                        className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
                          isCompleted
                            ? "bg-green-500 text-white"
                            : isToday
                              ? "bg-secondary ring-1 ring-ember/30"
                              : "bg-secondary/50"
                        }`}
                      >
                        {isCompleted && (
                          <Check className="w-3 h-3" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Streak */}
                <div className="w-16 text-right">
                  {habit.streak > 0 ? (
                    <span className="text-xs font-medium text-ember flex items-center justify-end gap-0.5">
                      <Flame className="w-3 h-3" />
                      {habit.streak}d
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground/40">
                      0d
                    </span>
                  )}
                </div>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(habit.id)}
                  className="p-1 opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
