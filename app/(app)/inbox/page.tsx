"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/lib/stores/app-store";
import { COACHES } from "@/lib/coaches/catalog";
import { CoachAvatarSmall } from "@/components/coach-avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Inbox,
  MessageCircle,
  Sparkles,
  X,
  Check,
  Loader2,
  RefreshCw,
  Heart,
  HelpCircle,
  Trophy,
  Target,
  Bell,
} from "lucide-react";
import Link from "next/link";
import type { Coach, Touchpoint } from "@/lib/supabase/types";

const TYPE_CONFIG: Record<string, { icon: typeof Heart; label: string; color: string }> = {
  motivation: { icon: Sparkles, label: "Motivation", color: "text-amber-500 bg-amber-50" },
  accountability: { icon: Target, label: "Check-up", color: "text-blue-500 bg-blue-50" },
  check_in: { icon: Heart, label: "Check-in", color: "text-rose-500 bg-rose-50" },
  celebration: { icon: Trophy, label: "Celebration", color: "text-emerald-500 bg-emerald-50" },
  question: { icon: HelpCircle, label: "Reflection", color: "text-purple-500 bg-purple-50" },
};

export default function InboxPage() {
  const roster = useAppStore((s) => s.roster);
  const setUnreadTouchpoints = useAppStore((s) => s.setUnreadTouchpoints);
  const coaches = COACHES as unknown as Coach[];

  const [touchpoints, setTouchpoints] = useState<Touchpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadTouchpoints = useCallback(async () => {
    try {
      const res = await fetch("/api/touchpoints");
      if (res.ok) {
        const { touchpoints: tps } = await res.json();
        setTouchpoints(tps || []);
        // Update unread count in store
        const unread = (tps || []).filter((t: Touchpoint) => t.status === "delivered");
        setUnreadTouchpoints(unread);
      }
    } catch {
      // Non-critical
    } finally {
      setLoading(false);
    }
  }, [setUnreadTouchpoints]);

  useEffect(() => {
    loadTouchpoints();
  }, [loadTouchpoints]);

  const handleMarkRead = async (id: string) => {
    try {
      await fetch("/api/touchpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_read", touchpointId: id }),
      });
      loadTouchpoints();
    } catch {
      // Handle error
    }
  };

  const handleDismiss = async (id: string) => {
    setTouchpoints((prev) => prev.filter((t) => t.id !== id));
    try {
      await fetch("/api/touchpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dismiss", touchpointId: id }),
      });
      loadTouchpoints();
    } catch {
      // Handle error
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await fetch("/api/touchpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate" }),
      });
      await loadTouchpoints();
    } catch {
      // Handle error
    } finally {
      setGenerating(false);
    }
  };

  const unread = touchpoints.filter((t) => t.status === "delivered");
  const read = touchpoints.filter((t) => t.status === "read");

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Inbox className="w-8 h-8 text-ember" />
            Inbox
          </h1>
          <p className="text-muted-foreground text-sm">
            Messages from your coaches — check-ins, motivation, and accountability.
          </p>
        </div>
        {roster.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={generating}
            className="shrink-0"
          >
            {generating ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            )}
            {generating ? "Generating..." : "Get messages"}
          </Button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading messages...</p>
        </div>
      ) : touchpoints.length === 0 && roster.length === 0 ? (
        <EmptyInbox type="no-roster" />
      ) : touchpoints.length === 0 ? (
        <EmptyInbox type="no-messages" onGenerate={handleGenerate} generating={generating} />
      ) : (
        <div className="space-y-6">
          {/* Unread section */}
          {unread.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Bell className="w-3.5 h-3.5 text-ember" />
                <h2 className="text-xs font-semibold text-ember uppercase tracking-wider">
                  New ({unread.length})
                </h2>
              </div>
              <div className="space-y-2">
                {unread.map((tp) => (
                  <TouchpointCard
                    key={tp.id}
                    touchpoint={tp}
                    coach={coaches.find((c) => c.id === tp.coach_id)}
                    isNew
                    onRead={() => handleMarkRead(tp.id)}
                    onDismiss={() => handleDismiss(tp.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Read section */}
          {read.length > 0 && (
            <section>
              {unread.length > 0 && (
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Earlier
                </h2>
              )}
              <div className="space-y-2">
                {read.map((tp) => (
                  <TouchpointCard
                    key={tp.id}
                    touchpoint={tp}
                    coach={coaches.find((c) => c.id === tp.coach_id)}
                    onDismiss={() => handleDismiss(tp.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function TouchpointCard({
  touchpoint,
  coach,
  isNew,
  onRead,
  onDismiss,
}: {
  touchpoint: Touchpoint;
  coach?: Coach;
  isNew?: boolean;
  onRead?: () => void;
  onDismiss: () => void;
}) {
  if (!coach) return null;

  const config = TYPE_CONFIG[touchpoint.touchpoint_type] || TYPE_CONFIG.motivation;
  const TypeIcon = config.icon;
  const accentColor = coach.accent_color || "#e8633b";

  return (
    <div
      className={`flex gap-3 p-4 rounded-xl border transition-colors ${
        isNew
          ? "border-ember/20 bg-ember/[0.02]"
          : "border-border/50 bg-card hover:border-border/80"
      }`}
    >
      <CoachAvatarSmall name={coach.name} accentColor={accentColor} size={40} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm">{coach.name}</p>
            <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${config.color} border-current/20`}>
              <TypeIcon className="w-2.5 h-2.5 mr-0.5" />
              {config.label}
            </Badge>
            {isNew && (
              <div className="w-1.5 h-1.5 rounded-full bg-ember animate-pulse" />
            )}
          </div>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {formatTime(touchpoint.scheduled_for || touchpoint.created_at)}
          </span>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">{touchpoint.content}</p>

        <div className="flex items-center gap-2 mt-2">
          <Link href={`/coach/${coach.id}/chat`}>
            <Button variant="ghost" size="sm" className="text-xs h-7 text-ember hover:text-ember/80 px-2">
              <MessageCircle className="w-3 h-3 mr-1" /> Reply
            </Button>
          </Link>
          {isNew && onRead && (
            <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground px-2" onClick={onRead}>
              <Check className="w-3 h-3 mr-1" /> Mark read
            </Button>
          )}
          <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground/50 px-2 ml-auto" onClick={onDismiss}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function EmptyInbox({
  type,
  onGenerate,
  generating,
}: {
  type: "no-roster" | "no-messages";
  onGenerate?: () => void;
  generating?: boolean;
}) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 rounded-2xl bg-ember/10 flex items-center justify-center mx-auto mb-4">
        <Inbox className="w-8 h-8 text-ember" />
      </div>
      {type === "no-roster" ? (
        <>
          <h2 className="text-xl font-semibold mb-2">No messages yet</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
            Add coaches to your squad and they&apos;ll start reaching out with personalized guidance.
          </p>
          <Link href="/discover">
            <Button className="bg-ember hover:bg-ember/90 text-white">Browse Coaches</Button>
          </Link>
        </>
      ) : (
        <>
          <h2 className="text-xl font-semibold mb-2">All caught up!</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
            Your inbox is empty. Get new messages from your coaches.
          </p>
          {onGenerate && (
            <Button
              onClick={onGenerate}
              disabled={generating}
              className="bg-ember hover:bg-ember/90 text-white"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Get Coach Messages
            </Button>
          )}
        </>
      )}
    </div>
  );
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
