"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, ArrowRight, Check, Sparkles, Loader2, Bot, ExternalLink } from "lucide-react";
import { DOMAINS } from "@/lib/coaches/domains";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";

const GOAL_OPTIONS = [
  "Get fit & healthy",
  "Improve my diet",
  "Advance my career",
  "Build better relationships",
  "Manage stress & anxiety",
  "Build wealth",
  "Be a better parent",
  "Develop creativity",
  "Find purpose & meaning",
  "Lead more effectively",
  "Start a business",
  "Grow a garden",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function toggleGoal(goal: string) {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  }

  function toggleDomain(domain: string) {
    setSelectedDomains((prev) =>
      prev.includes(domain) ? prev.filter((d) => d !== domain) : [...prev, domain]
    );
  }

  function handleComplete() {
    setStep(4);
  }

  async function handleGoToApp() {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Try update first, insert if no profile exists
        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single();

        if (existing) {
          await (supabase
            .from("profiles") as any)
            .update({
              display_name: name,
              goals: selectedGoals,
              preferences: { domains: selectedDomains },
              onboarding_completed: true,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            })
            .eq("id", user.id);
        } else {
          await (supabase.from("profiles") as any).insert({
            id: user.id,
            display_name: name,
            goals: selectedGoals,
            preferences: { domains: selectedDomains },
            onboarding_completed: true,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          });
        }
      }
    } catch {
      toast.error("Couldn't save your preferences, but you can update them later in Settings.");
    } finally {
      setSaving(false);
    }
    router.push("/home");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-lg space-y-8">
        {/* Progress */}
        {step < 4 && (
          <div className="flex gap-2">
            {[0, 1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  s <= step ? "bg-ember" : "bg-muted"
                )}
              />
            ))}
          </div>
        )}

        {step === 0 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-ember flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Welcome to CoachSquad!</h1>
              <p className="text-muted-foreground">
                Let's personalize your experience. What should we call you?
              </p>
            </div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your first name"
              className="text-center text-lg h-12"
              autoFocus
            />
            <Button
              onClick={() => setStep(1)}
              disabled={!name.trim()}
              className="w-full bg-ember hover:bg-ember/90 text-white h-12 shadow-lg shadow-ember/20"
            >
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-2">Hi {name}! What are your goals?</h1>
              <p className="text-muted-foreground">Select all that resonate. This helps us recommend coaches.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {GOAL_OPTIONS.map((goal) => {
                const isSelected = selectedGoals.includes(goal);
                return (
                  <button
                    key={goal}
                    onClick={() => toggleGoal(goal)}
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm font-medium transition-all border",
                      isSelected
                        ? "bg-ember/15 border-ember/30 text-ember"
                        : "bg-card border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                    )}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 inline mr-1" />}
                    {goal}
                  </button>
                );
              })}
            </div>
            <Button
              onClick={() => setStep(2)}
              disabled={selectedGoals.length === 0}
              className="w-full bg-ember hover:bg-ember/90 text-white h-12 shadow-lg shadow-ember/20"
            >
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-2">Which areas interest you most?</h1>
              <p className="text-muted-foreground">We'll show these domains first when you browse coaches.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {DOMAINS.map((d) => {
                const isSelected = selectedDomains.includes(d.id);
                return (
                  <button
                    key={d.id}
                    onClick={() => toggleDomain(d.id)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                      isSelected
                        ? "bg-ember/10 border-ember/30"
                        : "bg-card border-border/50 hover:border-border"
                    )}
                  >
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", d.color)}>
                      <d.icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{d.label}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <Button
              onClick={() => setStep(3)}
              className="w-full bg-ember hover:bg-ember/90 text-white h-12 shadow-lg shadow-ember/20"
            >
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-amber-600" />
              </div>
              <h1 className="text-2xl font-bold mb-2">One thing to know</h1>
              <p className="text-muted-foreground">
                We believe in being upfront about what CoachSquad is.
              </p>
            </div>

            <div className="bg-card rounded-2xl border border-border/50 p-6 space-y-5 text-left">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Your coaches are AI characters</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Every coach has a crafted persona, backstory, and personality — but they&apos;re powered
                  by AI, not real professional experience. Their &ldquo;expertise&rdquo; comes from large language
                  models, not years in the field.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">But that doesn&apos;t mean they can&apos;t help</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Assembling a real team of 12 world-class coaches would cost hundreds of thousands per year.
                  Most people get <em>zero</em> coaching in most areas of their life. Your AI squad fills that
                  gap — use them for daily guidance, habit building, brainstorming, and accountability.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">The best of both worlds</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Take the plans, insights, and ideas your AI coaches generate and bring them to your
                  real doctor, therapist, financial advisor, or trainer. Get more out of the 1–2 human
                  professionals who matter most.
                </p>
              </div>
            </div>

            <div className="text-center">
              <Link href="/disclaimer" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-ember transition-colors">
                <ExternalLink className="w-3 h-3" />
                Full AI disclosure
              </Link>
            </div>

            <Button
              onClick={handleComplete}
              className="w-full bg-ember hover:bg-ember/90 text-white h-12 shadow-lg shadow-ember/20"
            >
              Got it — let&apos;s go! <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-8 text-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-ember flex items-center justify-center mx-auto mb-6 shadow-xl shadow-ember/20">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold mb-3">
                Your coaching team is ready, {name}!
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-md mx-auto">
                20 expert coaches across {DOMAINS.length} domains are waiting to help you grow.
                Start by browsing and adding coaches to your personal squad.
              </p>
            </div>

            <div className="bg-card rounded-2xl border border-border/50 p-6 text-left max-w-md mx-auto">
              <p className="text-sm font-semibold mb-3">What happens next:</p>
              <div className="space-y-3">
                {[
                  "Browse coaches and add your favorites to your squad",
                  "Complete an intake session so they understand your needs",
                  "Chat anytime — your coaches remember everything",
                  "Set goals, track habits, and build momentum together",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <div className="w-6 h-6 rounded-full bg-ember/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-ember">{i + 1}</span>
                    </div>
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={handleGoToApp}
              disabled={saving}
              className="bg-ember hover:bg-ember/90 text-white h-12 px-8 text-base shadow-lg shadow-ember/20"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  Let&apos;s go! <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
