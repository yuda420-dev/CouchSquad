"use client";

import { use, useState, useEffect, useRef, useCallback } from "react";
import { COACHES } from "@/lib/coaches/catalog";
import { getDomain } from "@/lib/coaches/domains";
import { PersonalitySliders } from "@/components/personality-sliders";
import { CoachAvatar } from "@/components/coach-avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/lib/stores/app-store";
import { MAX_ROSTER_SIZE } from "@/lib/utils/constants";
import { ArrowLeft, MessageCircle, Plus, Check, ClipboardList, Save, Cloud, Brain, Clock, Sparkles, GraduationCap, Heart, Quote } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { Coach, PersonalityTraits, UserRoster } from "@/lib/supabase/types";

export default function CoachProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const coaches = COACHES as unknown as Coach[];
  const coach = coaches.find((c) => c.id === id);

  const roster = useAppStore((s) => s.roster);
  const addToRoster = useAppStore((s) => s.addToRoster);
  const removeFromRoster = useAppStore((s) => s.removeFromRoster);

  const isOnRoster = roster.some((r) => r.coach_id === id);

  const [overrides, setOverrides] = useState<Partial<PersonalityTraits>>({});
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedRef = useRef(false);

  // Load saved personality overrides on mount
  useEffect(() => {
    if (!coach) return;

    async function loadSettings() {
      try {
        const res = await fetch(`/api/settings?coachId=${coach!.id}`);
        if (res.ok) {
          const { settings } = await res.json();
          if (settings?.personality_overrides) {
            setOverrides(settings.personality_overrides);
          }
        }
      } catch {
        // Non-critical — use defaults
      } finally {
        loadedRef.current = true;
      }
    }

    loadSettings();
  }, [coach]);

  // Auto-save personality overrides (debounced 1.5s after last change)
  const saveOverrides = useCallback(
    async (newOverrides: Partial<PersonalityTraits>) => {
      if (!coach) return;
      setSaveStatus("saving");

      try {
        const res = await fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            coachId: coach.id,
            personalityOverrides: newOverrides,
          }),
        });

        if (res.ok) {
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 2000);
        }
      } catch {
        setSaveStatus("idle");
      }
    },
    [coach]
  );

  function handleOverridesChange(newOverrides: Partial<PersonalityTraits>) {
    setOverrides(newOverrides);

    // Debounced auto-save
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (loadedRef.current) {
      saveTimerRef.current = setTimeout(() => saveOverrides(newOverrides), 1500);
    }
  }

  // Load recent conversations and memories for this coach
  const [recentConvos, setRecentConvos] = useState<
    { id: string; type: string; message_count: number; last_message_at: string | null; created_at: string }[]
  >([]);
  const [memories, setMemories] = useState<
    { fact: string; category: string; importance: number }[]
  >([]);

  useEffect(() => {
    if (!coach || !isOnRoster) return;

    async function loadCoachData() {
      try {
        const [convosRes, huddleRes] = await Promise.all([
          fetch(`/api/conversations?coachId=${coach!.id}`),
          fetch("/api/huddle"),
        ]);

        if (convosRes.ok) {
          const { conversations } = await convosRes.json();
          setRecentConvos(
            (conversations || [])
              .filter((c: any) => c.message_count > 0)
              .slice(0, 5)
          );
        }

        if (huddleRes.ok) {
          const huddle = await huddleRes.json();
          const summary = huddle.coachSummaries?.find(
            (s: any) => s.coach_id === coach!.id
          );
          if (summary?.memories) {
            setMemories(summary.memories);
          }
        }
      } catch {
        // Non-critical
      }
    }

    loadCoachData();
  }, [coach, isOnRoster]);

  function handleReset() {
    setOverrides({});
    saveOverrides({});
  }

  if (!coach) {
    return (
      <div className="p-6 text-center py-20">
        <p className="text-xl font-semibold">Coach not found</p>
        <Link href="/discover" className="text-ember hover:text-ember/80 text-sm mt-2 inline-block">
          Back to Discover
        </Link>
      </div>
    );
  }

  const domain = getDomain(coach.domain);
  const accentColor = coach.accent_color || "#e8633b";

  function handleToggle() {
    if (isOnRoster) {
      removeFromRoster(id);
      toast.success("Removed from your squad");
    } else {
      if (roster.length >= MAX_ROSTER_SIZE) {
        toast.error(`Your squad is full! Maximum ${MAX_ROSTER_SIZE} coaches.`);
        return;
      }
      const item: UserRoster = {
        id: crypto.randomUUID(),
        user_id: "",
        coach_id: id,
        added_at: new Date().toISOString(),
        is_active: true,
        intake_completed: false,
        last_interaction: null,
      };
      addToRoster(item);
      toast.success("Added to your squad!");
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Back */}
      <Link
        href="/discover"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Discover
      </Link>

      {/* Profile header */}
      <div className="flex flex-col sm:flex-row gap-6 mb-8">
        <CoachAvatar
          name={coach.name}
          accentColor={accentColor}
          avatarUrl={coach.avatar_url}
          personality={coach.default_personality}
          size={80}
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold mb-1">{coach.name}</h1>
          <div className="flex items-center gap-2 mb-2">
            {domain && <Badge variant="secondary">{domain.label}</Badge>}
            {coach.sub_domain && (
              <span className="text-sm text-muted-foreground">{coach.sub_domain}</span>
            )}
            {coach.age && (
              <span className="text-sm text-muted-foreground">Age {coach.age}</span>
            )}
          </div>
          {coach.tagline && (
            <p className="text-muted-foreground italic">&ldquo;{coach.tagline}&rdquo;</p>
          )}
        </div>
        <div className="flex sm:flex-col gap-2 shrink-0">
          <Button
            onClick={handleToggle}
            className={
              isOnRoster
                ? ""
                : "bg-ember hover:bg-ember/90 text-white"
            }
            variant={isOnRoster ? "secondary" : "default"}
          >
            {isOnRoster ? (
              <><Check className="w-4 h-4 mr-2" /> On Squad</>
            ) : (
              <><Plus className="w-4 h-4 mr-2" /> Add to Squad</>
            )}
          </Button>
          {isOnRoster && (
            <>
              <Link href={`/coach/${id}/chat`}>
                <Button variant="outline" className="w-full">
                  <MessageCircle className="w-4 h-4 mr-2" /> Chat
                </Button>
              </Link>
              <Link href={`/coach/${id}/intake`}>
                <Button variant="outline" className="w-full">
                  <ClipboardList className="w-4 h-4 mr-2" /> Intake
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      <Separator className="mb-8" />

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Left column — Bio */}
        <div className="lg:col-span-3 space-y-6">
          {/* Coaching Style & Catchphrase Hero Card */}
          <section className="rounded-2xl border border-border/50 bg-card p-6 relative overflow-hidden">
            <div
              className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
              style={{ backgroundColor: accentColor }}
            />
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    className="text-xs font-medium capitalize"
                    style={{ backgroundColor: `${accentColor}15`, color: accentColor, borderColor: `${accentColor}30` }}
                  >
                    {coach.coaching_style} coaching
                  </Badge>
                  {domain && <Badge variant="secondary">{domain.label}</Badge>}
                </div>
                {coach.catchphrase && (
                  <div className="flex items-start gap-2 mt-3">
                    <Quote className="w-4 h-4 shrink-0 mt-0.5" style={{ color: accentColor }} />
                    <p className="text-sm italic text-muted-foreground leading-relaxed">
                      {coach.catchphrase}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Heart className="w-5 h-5" style={{ color: accentColor }} />
              Background
            </h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {coach.backstory}
            </p>
          </section>

          <section className="rounded-2xl bg-muted/30 border border-border/30 p-5">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5" style={{ color: accentColor }} />
              Philosophy
            </h2>
            <p className="text-muted-foreground leading-relaxed">{coach.philosophy}</p>
          </section>

          {coach.training_background && (
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <GraduationCap className="w-5 h-5" style={{ color: accentColor }} />
                Training & Credentials
              </h2>
              <p className="text-muted-foreground">{coach.training_background}</p>
            </section>
          )}

          {coach.specialties?.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3">What I Help With</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {coach.specialties.map((s) => (
                  <div
                    key={s}
                    className="flex items-center gap-2 rounded-xl border border-border/50 bg-card px-3 py-2.5"
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: accentColor }}
                    />
                    <span className="text-sm capitalize">{s}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Sample conversation */}
          {coach.sample_messages && coach.sample_messages.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3">Sample Conversation</h2>
              <div className="space-y-3 bg-muted/30 rounded-lg p-4">
                {coach.sample_messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-ember/10 text-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Coach Memories */}
          {isOnRoster && memories.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Brain className="w-5 h-5 text-muted-foreground" />
                What {coach.name.split(" ")[0]} Remembers
              </h2>
              <div className="space-y-2">
                {memories.map((mem, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <span
                      className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: accentColor }}
                    />
                    <span className="leading-relaxed">{mem.fact}</span>
                    <span className="shrink-0 text-[10px] text-muted-foreground/50 capitalize mt-0.5">
                      {mem.category}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recent Conversations */}
          {isOnRoster && recentConvos.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-muted-foreground" />
                Recent Conversations
              </h2>
              <div className="space-y-2">
                {recentConvos.map((convo) => (
                  <Link
                    key={convo.id}
                    href={`/coach/${id}/chat`}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card hover:border-border/80 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium capitalize">{convo.type} session</p>
                      <p className="text-[10px] text-muted-foreground">
                        {convo.message_count} messages
                      </p>
                    </div>
                    <p className="text-[10px] text-muted-foreground shrink-0">
                      {convo.last_message_at
                        ? formatRelativeTime(convo.last_message_at)
                        : formatRelativeTime(convo.created_at)}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right column — Personality sliders */}
        <div className="lg:col-span-2">
          <div className="sticky top-6 bg-card rounded-xl border border-border/50 p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold">Personality Tuning</h3>
              {saveStatus === "saving" && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Save className="w-3 h-3 animate-pulse" /> Saving...
                </span>
              )}
              {saveStatus === "saved" && (
                <span className="text-[10px] text-emerald-600 flex items-center gap-1">
                  <Cloud className="w-3 h-3" /> Saved
                </span>
              )}
            </div>
            <PersonalitySliders
              baseTraits={coach.default_personality}
              overrides={overrides}
              onChange={handleOverridesChange}
              onReset={handleReset}
            />
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
