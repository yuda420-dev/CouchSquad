"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Settings, User, Bell, Shield, Zap, Sun, Moon, Monitor, Download, Sparkles, Loader2, Check, CreditCard, Crown, ExternalLink } from "lucide-react";
import { useTheme } from "@/lib/hooks/use-theme";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useAppStore } from "@/lib/stores/app-store";
import { useSubscription } from "@/lib/hooks/use-subscription";
import { getPlanByTier } from "@/lib/stripe/config";
import Link from "next/link";

export default function SettingsPage() {
  const profile = useAppStore((s) => s.profile);
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const { theme, setTheme } = useTheme();
  const [exporting, setExporting] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [demoLoaded, setDemoLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { subscription, tier, loading: subLoading, isPro, isFree } = useSubscription();
  const [portalLoading, setPortalLoading] = useState(false);

  // Load profile data on mount
  useEffect(() => {
    if (profile) {
      setName(profile.display_name || "");
      setTimezone(profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
  }, [profile]);

  async function handleSaveProfile() {
    setSaving(true);
    setSaved(false);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await (supabase
          .from("profiles") as any)
          .update({ display_name: name, timezone })
          .eq("id", user.id);
        if (error) throw error;
        toast.success("Settings saved");
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleExportData() {
    setExporting(true);
    try {
      const res = await fetch("/api/export");
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `coachsquad-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // Handle error
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences.</p>
      </div>

      {/* Demo Data */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-ember" />
          <h2 className="text-lg font-semibold">Demo Mode</h2>
        </div>
        <div className="bg-card rounded-xl border border-ember/20 p-5">
          <p className="text-sm text-muted-foreground mb-3">
            Load realistic sample data to explore CoachSquad with pre-populated coaches,
            conversations, goals, habits, and journal entries.
          </p>
          <Button
            size="sm"
            className="bg-ember hover:bg-ember/90 text-white"
            disabled={loadingDemo || demoLoaded}
            onClick={async () => {
              setLoadingDemo(true);
              try {
                const res = await fetch("/api/demo", { method: "POST" });
                if (res.ok) {
                  setDemoLoaded(true);
                  window.location.href = "/home";
                }
              } catch {
                // Handle error
              } finally {
                setLoadingDemo(false);
              }
            }}
          >
            {loadingDemo ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Loading demo data...
              </>
            ) : demoLoaded ? (
              "Demo data loaded!"
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Load Demo Data
              </>
            )}
          </Button>
        </div>
      </section>

      <Separator className="mb-8" />

      {/* Billing & Subscription */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-ember" />
          <h2 className="text-lg font-semibold">Billing & Subscription</h2>
        </div>
        <div className="bg-card rounded-xl border border-border/50 p-5 space-y-4">
          {subLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading subscription...
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">Current Plan</p>
                    {!isFree && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-ember/10 text-ember">
                        <Crown className="w-3 h-3" />
                        {getPlanByTier(tier).name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isFree
                      ? "Free Starter plan — 2 coaches from 50+, 15 messages/day"
                      : `$${getPlanByTier(tier).price}/month — ${getPlanByTier(tier).description}`}
                  </p>
                  {subscription?.cancel_at_period_end && subscription.current_period_end && (
                    <p className="text-xs text-amber-600 mt-1">
                      Cancels at end of period ({new Date(subscription.current_period_end).toLocaleDateString()})
                    </p>
                  )}
                  {subscription?.status === "past_due" && (
                    <p className="text-xs text-red-500 mt-1 font-medium">
                      Payment past due — please update your payment method
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {isFree ? (
                  <Link href="/pricing">
                    <Button size="sm" className="bg-ember hover:bg-ember/90 text-white">
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                      Upgrade Plan
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={portalLoading}
                      onClick={async () => {
                        setPortalLoading(true);
                        try {
                          const res = await fetch("/api/stripe/portal", { method: "POST" });
                          const data = await res.json();
                          if (data.url) {
                            window.location.href = data.url;
                          } else {
                            toast.error("Could not open billing portal");
                          }
                        } catch {
                          toast.error("Something went wrong");
                        } finally {
                          setPortalLoading(false);
                        }
                      }}
                    >
                      {portalLoading ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      Manage Billing
                    </Button>
                    <Link href="/pricing">
                      <Button size="sm" variant="ghost" className="text-muted-foreground">
                        Change Plan
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      <Separator className="mb-8" />

      {/* Profile */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Profile</h2>
        </div>
        <div className="space-y-4 bg-card rounded-xl border border-border/50 p-5">
          <div>
            <label className="text-sm font-medium mb-1 block">Display Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Timezone</label>
            <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} />
          </div>
          <Button
            size="sm"
            onClick={handleSaveProfile}
            disabled={saving}
            className="bg-ember hover:bg-ember/90 text-white"
          >
            {saving ? (
              <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Saving...</>
            ) : saved ? (
              <><Check className="w-3.5 h-3.5 mr-1.5" />Saved!</>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </section>

      <Separator className="mb-8" />

      {/* Appearance */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Sun className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Appearance</h2>
        </div>
        <div className="bg-card rounded-xl border border-border/50 p-5">
          <p className="text-sm text-muted-foreground mb-3">Choose your preferred theme.</p>
          <div className="flex gap-2">
            {([
              { value: "light", icon: Sun, label: "Light" },
              { value: "dark", icon: Moon, label: "Dark" },
              { value: "system", icon: Monitor, label: "System" },
            ] as const).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  theme === opt.value
                    ? "bg-ember/10 text-ember border border-ember/30"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 border border-transparent"
                }`}
              >
                <opt.icon className="w-4 h-4" />
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <Separator className="mb-8" />

      {/* Notifications */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Notifications</h2>
        </div>
        <div className="bg-card rounded-xl border border-border/50 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Coach Check-ins</p>
              <p className="text-xs text-muted-foreground">Receive proactive messages from your coaches</p>
            </div>
            <Button variant="secondary" size="sm">Enabled</Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Quiet Hours</p>
              <p className="text-xs text-muted-foreground">No notifications between 10pm - 8am</p>
            </div>
            <Button variant="secondary" size="sm">Configure</Button>
          </div>
        </div>
      </section>

      <Separator className="mb-8" />

      {/* Wearables */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Wearable Devices</h2>
        </div>
        <div className="bg-card rounded-xl border border-dashed border-border/50 p-5 text-center">
          <p className="text-muted-foreground text-sm mb-2">
            Wearable integration coming soon. Connect your Apple Watch, Fitbit, or Oura Ring
            for personalized coaching based on your real-time health data.
          </p>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
            Coming Soon
          </span>
        </div>
      </section>

      <Separator className="mb-8" />

      {/* Privacy */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Privacy & Data</h2>
        </div>
        <div className="bg-card rounded-xl border border-border/50 p-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            Your conversations are <span className="font-medium text-foreground">encrypted at rest with AES-256</span>.
            Even our team cannot read your chats, memories, or journal entries.
            We track only anonymous, aggregate metrics (like coach popularity) — never linked to your identity.{" "}
            <Link href="/privacy" className="text-ember hover:text-ember/80 font-medium underline underline-offset-2">
              See our full privacy details
            </Link>
            {" · "}
            <a href="/disclaimer" className="text-ember hover:text-ember/80 font-medium underline underline-offset-2">
              AI disclosure
            </a>
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportData}
              disabled={exporting}
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              {exporting ? "Exporting..." : "Export My Data"}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => toast.info("Account deletion is not available yet. Contact support for assistance.")}
            >
              Delete Account
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
