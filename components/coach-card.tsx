"use client";

import { useState } from "react";
import { type Coach } from "@/lib/supabase/types";
import { getDomain } from "@/lib/coaches/domains";
import { PERSONALITY_TRAITS } from "@/lib/coaches/personality";
import { getCoachAvailability, getStatusColor } from "@/lib/coaches/availability";
import { Button } from "@/components/ui/button";
import { Plus, Check, MessageCircle } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CoachAvatar } from "@/components/coach-avatar";
import { PersonalityFlower } from "@/components/decorative";

interface CoachCardProps {
  coach: Coach;
  isOnRoster?: boolean;
  onToggleRoster?: (coachId: string) => void;
  rosterLoading?: boolean;
  compact?: boolean;
  index?: number;
}

function PersonalityBars({ traits }: { traits: Coach["default_personality"] }) {
  const topTraits = PERSONALITY_TRAITS.filter(
    (t) => traits[t.key] >= 70 || traits[t.key] <= 30
  ).slice(0, 3);

  if (!topTraits.length) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {topTraits.map((t) => {
        const val = traits[t.key];
        const label = val >= 70 ? t.highLabel : t.lowLabel;
        const emoji = val >= 70 ? t.highEmoji : t.lowEmoji;
        return (
          <span
            key={t.key}
            className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground"
          >
            {emoji} {label}
          </span>
        );
      })}
    </div>
  );
}

export function CoachCard({ coach, isOnRoster, onToggleRoster, rosterLoading, compact, index = 0 }: CoachCardProps) {
  const domain = getDomain(coach.domain);
  const availability = getCoachAvailability(coach.domain);
  const [taglineExpanded, setTaglineExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
      className="group relative rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 hover:border-ember/20 hover:shadow-lg hover:shadow-ember/[0.06] card-warm"
    >
      {/* Top accent gradient */}
      <div
        className="h-[3px]"
        style={{
          background: `linear-gradient(90deg, transparent, ${coach.accent_color || "#e8633b"}, transparent)`,
        }}
      />

      <div className={compact ? "p-4" : "p-5"}>
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          {/* Avatar */}
          <div className="relative">
            <CoachAvatar
              name={coach.name}
              accentColor={coach.accent_color || "#e8633b"}
              avatarUrl={coach.avatar_url}
              personality={coach.default_personality}
              size={48}
              className="transition-transform group-hover:scale-105"
            />
            {isOnRoster ? (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-card">
                <Check className="w-2.5 h-2.5 text-white" />
              </div>
            ) : (
              <div
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${getStatusColor(availability.status)}`}
                title={availability.label}
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <Link href={`/coach/${coach.id}`} className="hover:opacity-80 transition-opacity">
              <h3 className="font-semibold text-sm leading-tight truncate text-foreground">{coach.name}</h3>
            </Link>
            {domain && (
              <div
                className="inline-flex items-center gap-1 mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${coach.accent_color || "#e8633b"}10`,
                  color: coach.accent_color || "#e8633b",
                }}
              >
                <domain.icon className="w-2.5 h-2.5" />
                {domain.label}
              </div>
            )}
            {coach.sub_domain && (
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{coach.sub_domain}</p>
            )}
          </div>
        </div>

        {/* Tagline */}
        {coach.tagline && (
          <p
            className={`text-xs text-muted-foreground italic mb-1 leading-relaxed cursor-pointer transition-all ${taglineExpanded ? "" : "line-clamp-2"}`}
            onClick={(e) => { e.preventDefault(); setTaglineExpanded(!taglineExpanded); }}
            title={taglineExpanded ? "Click to collapse" : "Click to read full description"}
          >
            &ldquo;{coach.tagline}&rdquo;
          </p>
        )}

        {/* Personality viz */}
        {compact ? (
          <PersonalityBars traits={coach.default_personality} />
        ) : (
          <div className="flex items-center gap-3 mt-3">
            <PersonalityFlower
              traits={coach.default_personality}
              color={coach.accent_color || "#e8633b"}
              size={48}
            />
            <PersonalityBars traits={coach.default_personality} />
          </div>
        )}

        {/* Specialties */}
        {!compact && coach.specialties?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {coach.specialties.slice(0, 3).map((s) => (
              <span
                key={s}
                className="text-[9px] px-1.5 py-0.5 rounded-md bg-secondary border border-border text-muted-foreground/70"
              >
                {s}
              </span>
            ))}
            {coach.specialties.length > 3 && (
              <span className="text-[9px] text-muted-foreground/40 self-center">
                +{coach.specialties.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4 pt-3 border-t border-border">
          {onToggleRoster && (
            <Button
              size="sm"
              variant={isOnRoster ? "secondary" : "default"}
              className={
                isOnRoster
                  ? "bg-secondary hover:bg-border border border-border text-sm h-8"
                  : "bg-ember hover:bg-ember/90 text-white shadow-md shadow-ember/15 text-sm h-8"
              }
              onClick={() => onToggleRoster(coach.id)}
              disabled={rosterLoading}
            >
              {isOnRoster ? (
                <>
                  <Check className="w-3 h-3 mr-1" /> On Squad
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3 mr-1" /> Draft
                </>
              )}
            </Button>
          )}
          {isOnRoster && (
            <Link href={`/coach/${coach.id}/chat`}>
              <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground h-8 text-sm">
                <MessageCircle className="w-3 h-3 mr-1" /> Chat
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Hover glow effect */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% -20%, ${coach.accent_color || "#e8633b"}06, transparent 70%)`,
        }}
      />
    </motion.div>
  );
}
