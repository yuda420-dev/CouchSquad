"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/lib/stores/app-store";
import { COACHES } from "@/lib/coaches/catalog";
import { CoachAvatarSmall } from "@/components/coach-avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Plus,
  Smile,
  Meh,
  Frown,
  Zap,
  Sun,
  Moon,
  Cloud,
  Loader2,
  Calendar,
  Flame,
  TrendingUp,
  ChevronDown,
  Tag,
  X,
} from "lucide-react";
import type { Coach } from "@/lib/supabase/types";

type MoodLevel = "great" | "good" | "okay" | "low" | "bad";
type EnergyLevel = "high" | "moderate" | "low";

interface EntryData {
  id: string;
  content: string;
  mood: MoodLevel | null;
  energy: EnergyLevel | null;
  tags: string[];
  coach_tags: string[];
  created_at: string;
}

interface JournalStats {
  totalEntries: number;
  streak: number;
  thisWeek: number;
  avgMood: string | null;
}

const MOOD_OPTIONS: { value: MoodLevel; emoji: string; label: string; color: string }[] = [
  { value: "great", emoji: "😊", label: "Great", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { value: "good", emoji: "🙂", label: "Good", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "okay", emoji: "😐", label: "Okay", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { value: "low", emoji: "😔", label: "Low", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { value: "bad", emoji: "😢", label: "Bad", color: "bg-red-100 text-red-700 border-red-200" },
];

const ENERGY_OPTIONS: { value: EnergyLevel; icon: typeof Zap; label: string }[] = [
  { value: "high", icon: Zap, label: "High" },
  { value: "moderate", icon: Sun, label: "Moderate" },
  { value: "low", icon: Cloud, label: "Low" },
];

export default function JournalPage() {
  const roster = useAppStore((s) => s.roster);
  const coaches = COACHES as unknown as Coach[];

  const [entries, setEntries] = useState<EntryData[]>([]);
  const [stats, setStats] = useState<JournalStats>({ totalEntries: 0, streak: 0, thisWeek: 0, avgMood: null });
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);

  // Compose state
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<MoodLevel | null>(null);
  const [energy, setEnergy] = useState<EnergyLevel | null>(null);
  const [coachTags, setCoachTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [entriesRes, statsRes] = await Promise.all([
        fetch("/api/journal?type=entries&limit=50"),
        fetch("/api/journal?type=stats"),
      ]);
      if (entriesRes.ok) {
        const { entries: e } = await entriesRes.json();
        setEntries(e || []);
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
    loadData();
  }, [loadData]);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_entry",
          content: content.trim(),
          mood,
          energy,
          coach_tags: coachTags,
        }),
      });

      if (res.ok) {
        setContent("");
        setMood(null);
        setEnergy(null);
        setCoachTags([]);
        setShowCompose(false);
        loadData();
      }
    } catch {
      // Handle error
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickMood = async (selectedMood: MoodLevel) => {
    try {
      await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "log_mood",
          mood: selectedMood,
        }),
      });
      loadData();
    } catch {
      // Handle error
    }
  };

  // Group entries by date
  const groupedEntries = entries.reduce<Record<string, EntryData[]>>((acc, entry) => {
    const date = new Date(entry.created_at).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-ember" />
            Journal
          </h1>
          <p className="text-muted-foreground text-sm">
            Reflect, track your mood, and share insights with your coaches.
          </p>
        </div>
        <Button
          onClick={() => setShowCompose(true)}
          className="bg-ember hover:bg-ember/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" /> New Entry
        </Button>
      </div>

      {/* Stats + Quick Mood */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="flex items-center gap-1 justify-center">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-2xl font-bold">{stats.streak}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Day Streak</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.thisWeek}</p>
              <p className="text-[10px] text-muted-foreground">This Week</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.totalEntries}</p>
              <p className="text-[10px] text-muted-foreground">Total</p>
            </div>
          </div>
        </div>

        {/* Quick mood check-in */}
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Quick mood check-in</p>
          <div className="flex gap-2">
            {MOOD_OPTIONS.map((m) => (
              <button
                key={m.value}
                onClick={() => handleQuickMood(m.value)}
                className="flex-1 text-center py-1.5 rounded-lg border border-transparent hover:border-border transition-colors text-lg"
                title={m.label}
              >
                {m.emoji}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Compose */}
      {showCompose && (
        <div className="rounded-xl border border-ember/20 bg-card p-5 mb-6 shadow-sm">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-ember" /> New Journal Entry
          </h3>

          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind? How was your day? What are you grateful for?"
            rows={4}
            className="mb-3"
            autoFocus
          />

          {/* Mood selector */}
          <div className="mb-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">How are you feeling?</p>
            <div className="flex gap-2">
              {MOOD_OPTIONS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMood(mood === m.value ? null : m.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                    mood === m.value
                      ? m.color
                      : "border-border/50 text-muted-foreground hover:border-border"
                  }`}
                >
                  <span>{m.emoji}</span> {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Energy selector */}
          <div className="mb-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">Energy level</p>
            <div className="flex gap-2">
              {ENERGY_OPTIONS.map((e) => (
                <button
                  key={e.value}
                  onClick={() => setEnergy(energy === e.value ? null : e.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                    energy === e.value
                      ? "bg-ember/10 text-ember border-ember/30"
                      : "border-border/50 text-muted-foreground hover:border-border"
                  }`}
                >
                  <e.icon className="w-3 h-3" /> {e.label}
                </button>
              ))}
            </div>
          </div>

          {/* Coach tags */}
          {roster.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Share with coaches <span className="text-muted-foreground/50">(optional)</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {roster.map((r) => {
                  const c = coaches.find((co) => co.id === r.coach_id);
                  if (!c) return null;
                  const isTagged = coachTags.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() =>
                        setCoachTags(
                          isTagged ? coachTags.filter((t) => t !== c.id) : [...coachTags, c.id]
                        )
                      }
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs transition-all ${
                        isTagged
                          ? "border-ember/30 bg-ember/5 text-ember"
                          : "border-border/50 text-muted-foreground hover:border-border"
                      }`}
                    >
                      <CoachAvatarSmall name={c.name} accentColor={c.accent_color || "#e8633b"} size={16} />
                      {c.name.split(" ")[0]}
                      {isTagged && <X className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-border/30">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowCompose(false);
                setContent("");
                setMood(null);
                setEnergy(null);
                setCoachTags([]);
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-ember hover:bg-ember/90 text-white"
              disabled={!content.trim() || submitting}
              onClick={handleSubmit}
            >
              {submitting ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <BookOpen className="w-3.5 h-3.5 mr-1.5" />
              )}
              Save Entry
            </Button>
          </div>
        </div>
      )}

      {/* Entries */}
      {loading ? (
        <div className="text-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading journal...</p>
        </div>
      ) : entries.length === 0 && !showCompose ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-ember/10 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-ember" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Start journaling</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
            Writing helps you process thoughts, track patterns, and give your coaches better context.
          </p>
          <Button onClick={() => setShowCompose(true)} className="bg-ember hover:bg-ember/90 text-white">
            <Plus className="w-4 h-4 mr-2" /> Write Your First Entry
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedEntries).map(([date, dayEntries]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {date}
                </h3>
              </div>
              <div className="space-y-3">
                {dayEntries.map((entry) => {
                  const moodOption = MOOD_OPTIONS.find((m) => m.value === entry.mood);
                  const taggedCoaches = entry.coach_tags
                    .map((id) => coaches.find((c) => c.id === id))
                    .filter(Boolean) as Coach[];

                  return (
                    <div key={entry.id} className="rounded-xl border border-border/50 bg-card p-4">
                      {/* Meta row */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(entry.created_at).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                        {moodOption && (
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${moodOption.color}`}>
                            {moodOption.emoji} {moodOption.label}
                          </Badge>
                        )}
                        {entry.energy && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {entry.energy === "high" ? "⚡" : entry.energy === "moderate" ? "☀️" : "☁️"}{" "}
                            {entry.energy}
                          </Badge>
                        )}
                      </div>

                      {/* Content */}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{entry.content}</p>

                      {/* Coach tags */}
                      {taggedCoaches.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-border/30">
                          <Tag className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">Shared with:</span>
                          {taggedCoaches.map((c) => (
                            <span key={c.id} className="text-[10px] text-ember font-medium">
                              {c.name.split(" ")[0]}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Tags */}
                      {entry.tags?.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {entry.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px]">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
