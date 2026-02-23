"use client";

import { Lock, Eye, EyeOff, Database, BarChart3, Download, Shield, Server, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const sections = [
  {
    icon: Lock,
    iconColor: "#22c55e",
    title: "Encrypted Conversations",
    description: "Your chats are encrypted at rest using AES-256-GCM encryption — the same standard used by banks and governments.",
    points: [
      "Every message you send is encrypted before it's stored in our database",
      "Coach memories and extracted facts about you are encrypted the same way",
      "Journal entries and intake answers are encrypted at rest",
      "Even our own team cannot read your conversations by looking at the database",
      "Encryption keys are stored separately from data — a database leak reveals nothing readable",
    ],
  },
  {
    icon: EyeOff,
    iconColor: "#8b5cf6",
    title: "What We Can't See",
    description: "Your private content is encrypted and inaccessible to anyone at CoachSquad.",
    points: [
      "Your chat messages with coaches — fully encrypted",
      "Memories that coaches learn about you — fully encrypted",
      "Your journal entries — fully encrypted",
      "Your intake session answers — fully encrypted",
      "We have no ability to search, read, or analyze your private content",
    ],
  },
  {
    icon: BarChart3,
    iconColor: "#f59e0b",
    title: "Anonymous Analytics",
    description: "We track aggregate platform metrics to improve CoachSquad — but never link activity to individual users.",
    points: [
      "We see which coaches are most popular (e.g., \"Fitness coaches got 5,000 messages this week\")",
      "We track session counts and coach usage patterns across all users",
      "We monitor domain engagement to know where to expand our coach roster",
      "Analytics events contain NO user IDs — they're completely anonymous",
      "We never sell, share, or monetize your data in any form",
    ],
  },
  {
    icon: Eye,
    iconColor: "#06b6d4",
    title: "What We Can See",
    description: "Aggregate, anonymous data that helps us build a better product.",
    points: [
      "Which coaches are being used (not by whom)",
      "Total message volume per domain (fitness, career, etc.)",
      "Subscription tier distribution (how many free vs. paid users)",
      "Feature adoption (voice sessions, goals, journal usage)",
      "None of this is linked to your identity or account",
    ],
  },
  {
    icon: Database,
    iconColor: "#e8633b",
    title: "Your Data, Your Control",
    description: "You own your data. Export it, review it, or delete it anytime.",
    points: [
      "Export all your data as JSON anytime from Settings → Privacy & Data",
      "Your export includes decrypted conversations, memories, goals, and journal entries",
      "Request account deletion and all your data is permanently removed",
      "We don't use your conversations to train AI models",
      "Our AI providers (Anthropic, OpenAI) don't use API calls for model training by default",
    ],
  },
  {
    icon: Server,
    iconColor: "#64748b",
    title: "Infrastructure Security",
    description: "Industry-standard security practices protect your data at every layer.",
    points: [
      "Database enforces Row-Level Security — users can only access their own data",
      "All data in transit is encrypted via HTTPS/TLS",
      "Authentication handled by Supabase with secure session management",
      "Payment processing through Stripe — we never store credit card data",
      "API keys and encryption keys stored in secure environment variables, not in code",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/15 text-green-600 text-xs font-medium mb-4">
          <Fingerprint className="w-3.5 h-3.5" />
          Privacy & Encryption
        </div>
        <h1 className="text-3xl font-bold mb-2">Your Privacy is Real, Not Marketing</h1>
        <p className="text-muted-foreground text-lg">
          We built CoachSquad so that even we can&apos;t read your conversations. Here&apos;s exactly how it works.
        </p>
      </div>

      {/* Trust badges */}
      <div className="grid grid-cols-3 gap-3 mb-10">
        {[
          { icon: Lock, label: "AES-256 Encrypted", sub: "Military-grade" },
          { icon: EyeOff, label: "Zero-Access", sub: "We can't read chats" },
          { icon: Shield, label: "RLS Enforced", sub: "Data isolation" },
        ].map((badge) => (
          <div
            key={badge.label}
            className="flex flex-col items-center gap-1.5 p-4 rounded-xl bg-card border border-border/50 text-center"
          >
            <badge.icon className="w-5 h-5 text-ember" />
            <span className="text-sm font-medium">{badge.label}</span>
            <span className="text-[11px] text-muted-foreground">{badge.sub}</span>
          </div>
        ))}
      </div>

      {/* Sections */}
      <div className="space-y-8">
        {sections.map((section) => (
          <div key={section.title} className="bg-card rounded-xl border border-border/50 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${section.iconColor}15` }}
              >
                <section.icon className="w-4.5 h-4.5" style={{ color: section.iconColor }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{section.title}</h2>
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </div>
            </div>
            <ul className="space-y-2 ml-12">
              {section.points.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 shrink-0 mt-2" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom links */}
      <div className="mt-10 flex flex-col items-center gap-4 text-center">
        <p className="text-sm text-muted-foreground">
          For our full AI transparency disclosure, see our{" "}
          <Link href="/disclaimer" className="text-ember hover:text-ember/80 font-medium underline underline-offset-2">
            AI Disclosure page
          </Link>
        </p>
        <div className="flex gap-3">
          <Link href="/settings">
            <Button variant="outline" size="sm">
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export My Data
            </Button>
          </Link>
          <a href="mailto:hello@coachsquad.com">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              Questions? Get in touch
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
