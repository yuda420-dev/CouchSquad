"use client";

import { useState, useCallback } from "react";

const MOODS = [
  { value: "great", emoji: "😊", label: "Great" },
  { value: "good", emoji: "🙂", label: "Good" },
  { value: "okay", emoji: "😐", label: "Okay" },
  { value: "low", emoji: "😔", label: "Low" },
  { value: "bad", emoji: "😢", label: "Bad" },
] as const;

interface MoodCheckInProps {
  todayMood?: string | null;
  streak?: number;
  onMoodLogged?: (mood: string) => void;
}

export function MoodCheckIn({ todayMood, streak = 0, onMoodLogged }: MoodCheckInProps) {
  const [selected, setSelected] = useState<string | null>(todayMood || null);
  const [saving, setSaving] = useState(false);

  const handleSelect = useCallback(
    async (mood: string) => {
      if (saving) return;
      setSelected(mood);
      setSaving(true);

      try {
        const res = await fetch("/api/journal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "log_mood", mood }),
        });
        if (res.ok) {
          onMoodLogged?.(mood);
        }
      } catch {
        // Non-critical
      } finally {
        setSaving(false);
      }
    },
    [saving, onMoodLogged]
  );

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">How are you feeling?</h3>
        {streak > 0 && (
          <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
            {streak} day streak
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        {MOODS.map((m) => {
          const isSelected = selected === m.value;
          return (
            <button
              key={m.value}
              onClick={() => handleSelect(m.value)}
              disabled={saving}
              className={`flex flex-col items-center gap-1 flex-1 py-2.5 rounded-xl transition-all ${
                isSelected
                  ? "bg-ember/10 ring-1 ring-ember scale-105"
                  : "hover:bg-secondary"
              }`}
            >
              <span className={`text-2xl transition-transform ${isSelected ? "scale-110" : ""}`}>
                {m.emoji}
              </span>
              <span className={`text-[10px] font-medium ${isSelected ? "text-ember" : "text-muted-foreground"}`}>
                {m.label}
              </span>
            </button>
          );
        })}
      </div>
      {selected && (
        <p className="text-[10px] text-center text-muted-foreground/60 mt-2">
          Logged for today
        </p>
      )}
    </div>
  );
}
