"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { CoachAvatarSmall } from "@/components/coach-avatar";
import {
  Sparkles,
  Loader2,
  ArrowRight,
  Heart,
  Clock,
  Target,
  Compass,
  ClipboardCheck,
  MessageCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Recommendation {
  coach_id: string;
  name: string;
  accent_color: string;
  domain: string;
  sub_domain: string;
  reason: string;
  priority: number;
  type: "check_in" | "mood_support" | "goal_update" | "discover" | "stale" | "intake";
}

const TYPE_CONFIG: Record<
  Recommendation["type"],
  { icon: typeof Heart; label: string; color: string }
> = {
  intake: { icon: ClipboardCheck, label: "Complete Intake", color: "text-amber-500" },
  mood_support: { icon: Heart, label: "Mood Support", color: "text-rose-500" },
  check_in: { icon: MessageCircle, label: "Check In", color: "text-blue-500" },
  stale: { icon: Clock, label: "Catch Up", color: "text-orange-500" },
  goal_update: { icon: Target, label: "Goal Update", color: "text-green-500" },
  discover: { icon: Compass, label: "Discover", color: "text-purple-500" },
};

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/recommendations");
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations || []);
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

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-ember" />
            For You
          </h1>
          <p className="text-muted-foreground text-sm">
            Smart suggestions based on your mood, goals, and coaching patterns.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={load}
          disabled={loading}
          className="text-muted-foreground"
        >
          <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Analyzing your patterns...</p>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="text-center py-20">
          <Sparkles className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No recommendations right now.</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Add coaches to your squad and start coaching to get personalized suggestions.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec) => {
            const config = TYPE_CONFIG[rec.type];
            const Icon = config.icon;
            const isDiscover = rec.type === "discover";
            const href = isDiscover
              ? `/coach/${rec.coach_id}`
              : rec.type === "intake"
                ? `/coach/${rec.coach_id}/intake`
                : `/coach/${rec.coach_id}/chat`;

            return (
              <Link
                key={rec.coach_id}
                href={href}
                className="group flex items-center gap-4 rounded-xl border border-border/50 bg-card p-4 hover:border-border hover:shadow-sm transition-all"
              >
                {/* Coach avatar */}
                <CoachAvatarSmall
                  name={rec.name}
                  accentColor={rec.accent_color}
                  size={44}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold truncate">{rec.name}</span>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-secondary ${config.color}`}
                    >
                      <Icon className="w-3 h-3" />
                      {config.label}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-snug">{rec.reason}</p>
                </div>

                {/* Arrow */}
                <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-ember group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
