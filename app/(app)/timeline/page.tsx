"use client";

import { useState, useEffect, useCallback } from "react";
import { CoachAvatarSmall } from "@/components/coach-avatar";
import { COACHES } from "@/lib/coaches/catalog";
import type { Coach } from "@/lib/supabase/types";
import {
  GitBranch,
  Loader2,
  MessageCircle,
  Target,
  Trophy,
  BookOpen,
  UserPlus,
  ClipboardCheck,
  Mic,
} from "lucide-react";

interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  coach_id: string | null;
  date: string;
  metadata?: Record<string, unknown>;
}

const MOOD_EMOJI: Record<string, string> = {
  great: "😊",
  good: "🙂",
  okay: "😐",
  low: "😔",
  bad: "😢",
};

const EVENT_CONFIG: Record<string, { icon: typeof MessageCircle; color: string; bgColor: string }> = {
  conversation: { icon: MessageCircle, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  intake: { icon: ClipboardCheck, color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
  goal_created: { icon: Target, color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30" },
  goal_completed: { icon: Trophy, color: "text-emerald-600", bgColor: "bg-emerald-100 dark:bg-emerald-900/30" },
  journal: { icon: BookOpen, color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
  roster_add: { icon: UserPlus, color: "text-ember", bgColor: "bg-orange-100 dark:bg-orange-900/30" },
  voice: { icon: Mic, color: "text-rose-600", bgColor: "bg-rose-100 dark:bg-rose-900/30" },
};

function groupByDate(events: TimelineEvent[]) {
  const groups: { date: string; label: string; events: TimelineEvent[] }[] = [];
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  for (const event of events) {
    const dateStr = event.date.slice(0, 10);
    let label: string;
    if (dateStr === today) label = "Today";
    else if (dateStr === yesterday) label = "Yesterday";
    else label = new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    const existing = groups.find((g) => g.date === dateStr);
    if (existing) {
      existing.events.push(event);
    } else {
      groups.push({ date: dateStr, label, events: [event] });
    }
  }

  return groups;
}

export default function TimelinePage() {
  const coaches = COACHES as unknown as Coach[];
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/timeline");
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
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

  const groups = groupByDate(events);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
          <GitBranch className="w-8 h-8 text-ember" />
          Your Journey
        </h1>
        <p className="text-muted-foreground text-sm">
          Every conversation, goal, and milestone in one place.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading your timeline...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20">
          <GitBranch className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No events yet.</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Start coaching to see your journey unfold.
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />

          {groups.map((group) => (
            <div key={group.date} className="mb-8">
              {/* Date header */}
              <div className="flex items-center gap-3 mb-4 relative">
                <div className="w-10 h-10 rounded-full bg-card border-2 border-border flex items-center justify-center z-10">
                  <span className="text-xs font-bold text-muted-foreground">
                    {new Date(group.date + "T12:00:00").getDate()}
                  </span>
                </div>
                <h2 className="text-sm font-semibold text-foreground">{group.label}</h2>
              </div>

              {/* Events */}
              <div className="space-y-3 ml-[19px] pl-8 border-l border-transparent">
                {group.events.map((event) => {
                  const config = EVENT_CONFIG[event.type] || EVENT_CONFIG.conversation;
                  const Icon = config.icon;
                  const coach = event.coach_id
                    ? coaches.find((c) => c.id === event.coach_id)
                    : null;

                  return (
                    <div
                      key={event.id}
                      className="group flex items-start gap-3 relative"
                    >
                      {/* Timeline dot */}
                      <div className="absolute -left-[13px] top-3 w-2 h-2 rounded-full bg-border group-hover:bg-ember transition-colors" />

                      {/* Event card */}
                      <div className="flex-1 rounded-xl border border-border/50 bg-card p-3.5 hover:border-border transition-colors">
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center shrink-0`}>
                            <Icon className={`w-4 h-4 ${config.color}`} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-sm font-medium truncate">{event.title}</p>
                              {event.type === "journal" && event.metadata?.mood ? (
                                <span className="text-sm">{MOOD_EMOJI[event.metadata.mood as string]}</span>
                              ) : null}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {event.description}
                            </p>
                            <p className="text-[10px] text-muted-foreground/50 mt-1">
                              {new Date(event.date).toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>

                          {/* Coach avatar */}
                          {coach && (
                            <CoachAvatarSmall
                              name={coach.name}
                              accentColor={coach.accent_color || "#e8633b"}
                              size={28}
                            />
                          )}
                        </div>
                      </div>
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
