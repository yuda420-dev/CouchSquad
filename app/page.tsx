"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Users,
  MessageCircle,
  Sparkles,
  Shield,
  Zap,
  Clock,
  Search,
  X,
  ChevronRight,
  Quote,
  Heart,
  Sun,
  Star,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COACHES } from "@/lib/coaches/catalog";
import { DOMAINS } from "@/lib/coaches/domains";
import { PERSONALITY_TRAITS } from "@/lib/coaches/personality";
import { CoachAvatar } from "@/components/coach-avatar";
import { GradientBlob, FloatingCircles, PersonalityFlower, WaveDivider } from "@/components/decorative";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

// ─── Coach card for the public catalog ──────────────────────
function PublicCoachCard({
  coach,
  index,
  onSelect,
}: {
  coach: (typeof COACHES)[0];
  index: number;
  onSelect: (coach: (typeof COACHES)[0]) => void;
}) {
  const domain = DOMAINS.find((d) => d.id === coach.domain);

  // Get notable personality traits
  const notable = PERSONALITY_TRAITS.filter(
    (t) => coach.default_personality[t.key] >= 70 || coach.default_personality[t.key] <= 30
  ).slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: Math.min(index * 0.04, 0.5),
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1] as const,
      }}
      onClick={() => onSelect(coach)}
      className="group relative rounded-2xl border border-border bg-card overflow-hidden cursor-pointer transition-all duration-300 hover:border-ember/20 hover:shadow-lg hover:shadow-ember/[0.06] hover:-translate-y-1 card-warm"
    >
      {/* Top accent gradient */}
      <div
        className="h-[3px]"
        style={{
          background: `linear-gradient(90deg, transparent, ${coach.accent_color || "#e8633b"}, transparent)`,
        }}
      />

      <div className="p-5">
        {/* Header with avatar */}
        <div className="flex items-start gap-3 mb-3">
          <CoachAvatar
            name={coach.name}
            accentColor={coach.accent_color || "#e8633b"}
            personality={coach.default_personality}
            size={48}
          />
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm leading-tight truncate text-foreground">{coach.name}</h3>
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
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                {coach.sub_domain}
              </p>
            )}
          </div>
        </div>

        {/* Tagline */}
        {coach.tagline && (
          <p className="text-xs text-muted-foreground italic mb-3 line-clamp-2 leading-relaxed">
            &ldquo;{coach.tagline}&rdquo;
          </p>
        )}

        {/* Personality flower + trait pills */}
        <div className="flex items-center gap-3 mb-3">
          <PersonalityFlower
            traits={coach.default_personality}
            color={coach.accent_color || "#e8633b"}
            size={52}
          />
          {notable.length > 0 && (
            <div className="flex flex-wrap gap-1 flex-1">
              {notable.map((t) => {
                const val = coach.default_personality[t.key];
                const label = val >= 70 ? t.highLabel : t.lowLabel;
                const emoji = val >= 70 ? t.highEmoji : t.lowEmoji;
                return (
                  <span
                    key={t.key}
                    className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-md bg-secondary border border-border text-muted-foreground"
                  >
                    {emoji} {label}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* View profile link */}
        <div className="flex items-center gap-1 pt-3 border-t border-border text-xs text-muted-foreground/60 group-hover:text-ember transition-colors">
          <span>View profile</span>
          <ChevronRight className="w-3 h-3" />
        </div>
      </div>

      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${coach.accent_color || "#e8633b"}08, transparent 70%)`,
        }}
      />
    </motion.div>
  );
}

// ─── Coach detail modal ─────────────────────────────────────
function CoachDetailPanel({
  coach,
  onClose,
}: {
  coach: (typeof COACHES)[0];
  onClose: () => void;
}) {
  const domain = DOMAINS.find((d) => d.id === coach.domain);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border border-border bg-card shadow-2xl shadow-black/10"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-secondary hover:bg-border flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Header accent bar */}
        <div
          className="h-1.5 rounded-t-3xl"
          style={{
            background: `linear-gradient(90deg, transparent, ${coach.accent_color || "#e8633b"}, transparent)`,
          }}
        />

        <div className="p-6 sm:p-8">
          {/* Avatar + name row */}
          <div className="flex items-start gap-4 mb-6">
            <CoachAvatar
              name={coach.name}
              accentColor={coach.accent_color || "#e8633b"}
              personality={coach.default_personality}
              size={72}
            />
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">{coach.name}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {domain && (
                  <span
                    className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${coach.accent_color || "#e8633b"}10`,
                      color: coach.accent_color || "#e8633b",
                    }}
                  >
                    <domain.icon className="w-3 h-3" />
                    {domain.label}
                  </span>
                )}
                {coach.sub_domain && (
                  <span className="text-xs text-muted-foreground">{coach.sub_domain}</span>
                )}
                {coach.age && (
                  <span className="text-xs text-muted-foreground/60">Age {coach.age}</span>
                )}
              </div>
            </div>
          </div>

          {/* Tagline */}
          {coach.tagline && (
            <div className="flex items-start gap-2 mb-6 p-4 rounded-xl bg-secondary/60 border border-border">
              <Quote className="w-4 h-4 text-ember shrink-0 mt-0.5" />
              <p className="text-sm italic text-muted-foreground">{coach.tagline}</p>
            </div>
          )}

          {/* Philosophy */}
          <div className="mb-6">
            <h3 className="text-xs font-medium tracking-[0.15em] uppercase text-ember mb-2">
              Philosophy
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{coach.philosophy}</p>
          </div>

          {/* Backstory */}
          <div className="mb-6">
            <h3 className="text-xs font-medium tracking-[0.15em] uppercase text-ember mb-2">
              Background
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
              {coach.backstory}
            </p>
          </div>

          {/* Personality — flower chart + sliders */}
          <div className="mb-6">
            <h3 className="text-xs font-medium tracking-[0.15em] uppercase text-ember mb-3">
              Personality
            </h3>
            <div className="flex gap-6 items-start">
              <PersonalityFlower
                traits={coach.default_personality}
                color={coach.accent_color || "#e8633b"}
                size={100}
              />
              <div className="flex-1 space-y-2.5">
                {PERSONALITY_TRAITS.map((trait) => {
                  const val = coach.default_personality[trait.key] || 50;
                  return (
                    <div key={trait.key} className="space-y-0.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground font-medium">{trait.label}</span>
                        <span className="text-foreground/50 tabular-nums">{val}</span>
                      </div>
                      <div className="relative h-2 rounded-full bg-black/[0.04] overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${val}%` }}
                          transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] as const }}
                          className="absolute inset-y-0 left-0 rounded-full"
                          style={{
                            background: `linear-gradient(90deg, ${coach.accent_color || "#e8633b"}, ${coach.accent_color || "#e8633b"}90)`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground/40">
                        <span>{trait.lowEmoji} {trait.lowLabel}</span>
                        <span>{trait.highLabel} {trait.highEmoji}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Specialties */}
          {coach.specialties && coach.specialties.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-medium tracking-[0.15em] uppercase text-ember mb-2">
                Specialties
              </h3>
              <div className="flex flex-wrap gap-2">
                {coach.specialties.map((s) => (
                  <span
                    key={s}
                    className="text-xs px-3 py-1 rounded-lg bg-secondary border border-border text-muted-foreground"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sample conversation */}
          {coach.sample_messages && coach.sample_messages.length >= 2 && (
            <div className="mb-6">
              <h3 className="text-xs font-medium tracking-[0.15em] uppercase text-ember mb-3">
                Sample Conversation
              </h3>
              <div className="space-y-3 p-4 rounded-xl bg-secondary/40 border border-border">
                {coach.sample_messages.map(
                  (msg: { role: string; content: string }, i: number) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-ember/10 text-foreground rounded-br-sm"
                            : "bg-card border border-border text-muted-foreground rounded-bl-sm shadow-sm"
                        }`}
                      >
                        {msg.role === "assistant" && (
                          <p className="text-[10px] font-medium text-ember mb-1">{coach.name}</p>
                        )}
                        <p className="line-clamp-6">{msg.content}</p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Link href="/signup" className="flex-1">
              <Button
                className="w-full bg-ember hover:bg-ember/90 text-white shadow-lg shadow-ember/15 rounded-xl h-11"
              >
                Draft {coach.name.split(" ")[0]} to Your Squad
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── MAIN LANDING PAGE ──────────────────────────────────────
export default function LandingPage() {
  const [domainFilter, setDomainFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCoach, setSelectedCoach] = useState<(typeof COACHES)[0] | null>(null);

  const coaches = COACHES;

  const filtered = useMemo(() => {
    let result = coaches;
    if (domainFilter) {
      result = result.filter((c) => c.domain === domainFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.domain.toLowerCase().includes(q) ||
          c.sub_domain?.toLowerCase().includes(q) ||
          c.tagline?.toLowerCase().includes(q) ||
          c.specialties?.some((s) => s.toLowerCase().includes(q))
      );
    }
    return result;
  }, [coaches, domainFilter, search]);

  // Pick 5 featured coaches for the hero strip
  const featured = coaches.filter(c =>
    ["c0010000-0000-4000-8000-000000000001", "c0010000-0000-4000-8000-000000000005", "c0010000-0000-4000-8000-000000000011", "c0010000-0000-4000-8000-000000000019", "c0010000-0000-4000-8000-000000000017"].includes(c.id)
  );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* ─── Background decorations ──────────────── */}
      <GradientBlob color1="#e8633b" color2="#f4a261" size={600} className="top-[-200px] right-[-200px]" delay={0} />
      <GradientBlob color1="#2a9d8f" color2="#e9c46a" size={500} className="top-[400px] left-[-250px]" delay={0.5} />
      <GradientBlob color1="#8B5CF6" color2="#EC4899" size={400} className="bottom-[200px] right-[-100px]" delay={1} />
      <FloatingCircles />

      {/* ─── NAV ─────────────────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border/50"
      >
        <div className="flex items-center justify-between px-6 lg:px-10 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-ember flex items-center justify-center shadow-lg shadow-ember/15">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              Coach<span className="text-ember">Squad</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/pricing">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                Pricing
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button
                size="sm"
                className="bg-ember hover:bg-ember/90 text-white shadow-md shadow-ember/15 transition-all hover:shadow-ember/25 hover:shadow-lg"
              >
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ─── HERO ────────────────────────────────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 lg:px-10 pt-16 sm:pt-24 pb-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="relative"
        >
          <motion.div variants={fadeUp} custom={0} className="flex justify-start mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-ember/[0.06] border border-ember/15 text-ember text-[13px] font-medium">
              <Sun className="w-3.5 h-3.5" />
              Draft your personal coaching team
            </div>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-bold leading-[1.05] tracking-tight mb-6 max-w-4xl text-foreground"
          >
            Surround yourself
            <br />
            with{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-ember via-ember-glow to-ember">
                world-class
              </span>
              <span className="absolute -bottom-1 left-0 right-0 h-[3px] bg-gradient-to-r from-ember to-ember-glow rounded-full opacity-50" />
            </span>
            <br />
            <span className="text-muted-foreground font-normal text-[0.65em]">coaches.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed mb-10"
          >
            Top athletes have entire teams behind them. Now you can too. Pick your squad of AI
            coaches — each with their own personality, expertise, and memory of you.
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="flex flex-wrap gap-4 mb-4">
            <Link href="/signup">
              <Button
                size="lg"
                className="glow-pulse bg-ember hover:bg-ember/90 text-white text-base px-8 h-13 shadow-xl shadow-ember/20 transition-all hover:shadow-ember/30 hover:shadow-2xl rounded-xl"
              >
                Build Your Squad
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="text-base px-8 h-13 border-border hover:border-ember/20 hover:bg-ember/[0.03] text-foreground rounded-xl"
              onClick={() => {
                document.getElementById("coach-catalog")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Browse Coaches ↓
            </Button>
          </motion.div>
        </motion.div>

        {/* ─── Featured coach strip ────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-12 pt-8 border-t border-border"
        >
          <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground/60 mb-4">
            Featured coaches
          </p>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
            {featured.map((coach) => (
              <button
                key={coach.id}
                onClick={() => setSelectedCoach(coach)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border hover:border-ember/20 transition-all shrink-0 card-warm hover:shadow-md group"
              >
                <CoachAvatar
                  name={coach.name}
                  accentColor={coach.accent_color || "#e8633b"}
                  personality={coach.default_personality}
                  size={40}
                />
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground group-hover:text-ember transition-colors">{coach.name}</p>
                  <p className="text-[11px] text-muted-foreground">{coach.sub_domain}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-ember/50 transition-colors ml-2" />
              </button>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ─── DOMAIN SHOWCASE ──────────────────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 lg:px-10 pt-16 pb-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={staggerContainer}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
        >
          {DOMAINS.slice(0, 8).map((domain, i) => {
            const count = COACHES.filter((c) => c.domain === domain.id).length;
            return (
              <motion.button
                key={domain.id}
                variants={fadeUp}
                custom={i}
                onClick={() => {
                  setDomainFilter(domain.id);
                  document.getElementById("coach-catalog")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="group flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border hover:border-ember/20 transition-all card-warm hover:shadow-md text-left"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${COACHES.find(c => c.domain === domain.id)?.accent_color || "#e8633b"}12` }}
                >
                  <domain.icon
                    className="w-4.5 h-4.5"
                    style={{ color: COACHES.find(c => c.domain === domain.id)?.accent_color || "#e8633b" }}
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{domain.label}</p>
                  <p className="text-[11px] text-muted-foreground">{count} coach{count !== 1 ? "es" : ""}</p>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </section>

      {/* ─── FULL COACH CATALOG ──────────────────────── */}
      <section id="coach-catalog" className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
        >
          <motion.div variants={fadeUp} custom={0} className="mb-8">
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-ember mb-3">
              Meet Your Coaches
            </p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold leading-tight max-w-lg mb-3 text-foreground">
              {COACHES.length} experts.<br />
              {DOMAINS.length} domains.
            </h2>
            <p className="text-muted-foreground max-w-lg">
              Click any coach to explore their backstory, personality, specialties,
              and sample conversation. No account needed.
            </p>
          </motion.div>

          {/* Search + domain filter */}
          <motion.div variants={fadeUp} custom={1} className="mb-6 space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
              <Input
                placeholder="Search coaches, domains, specialties..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-card border-border focus:border-ember/30 rounded-xl h-10 shadow-sm"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setDomainFilter(null)}
                className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  domainFilter === null
                    ? "bg-ember/[0.08] text-ember border border-ember/15 shadow-sm shadow-ember/10"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                All ({COACHES.length})
              </button>
              {DOMAINS.map((d) => {
                const count = COACHES.filter((c) => c.domain === d.id).length;
                return (
                  <button
                    key={d.id}
                    onClick={() => setDomainFilter(d.id === domainFilter ? null : d.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      domainFilter === d.id
                        ? "bg-ember/[0.08] text-ember border border-ember/15 shadow-sm shadow-ember/10"
                        : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <d.icon className="w-3.5 h-3.5" />
                    {d.label}
                    <span className="text-[10px] opacity-50">({count})</span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Results count */}
          <motion.p variants={fadeUp} custom={2} className="text-sm text-muted-foreground mb-4">
            {filtered.length} coach{filtered.length !== 1 ? "es" : ""}
            {domainFilter && (
              <span>
                {" "}in{" "}
                <span className="text-foreground font-medium">
                  {DOMAINS.find((d) => d.id === domainFilter)?.label}
                </span>
              </span>
            )}
          </motion.p>
        </motion.div>

        {/* Coach grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7 text-muted-foreground/40" />
            </div>
            <p className="text-lg font-medium text-foreground">No coaches found</p>
            <p className="text-sm mt-1 text-muted-foreground">Try a different search or filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((coach, i) => (
              <PublicCoachCard key={coach.id} coach={coach} index={i} onSelect={setSelectedCoach} />
            ))}
          </div>
        )}
      </section>

      {/* ─── HOW IT WORKS ────────────────────────────── */}
      <section className="relative z-10 py-20">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 via-secondary/60 to-secondary/30" />
        <div className="relative max-w-6xl mx-auto px-6 lg:px-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeUp} custom={0} className="mb-14 text-center">
              <p className="text-xs font-medium tracking-[0.2em] uppercase text-ember mb-3">
                How it works
              </p>
              <h2 className="font-display text-4xl sm:text-5xl font-bold leading-tight text-foreground">
                Your squad, your rules.
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Users,
                  num: "01",
                  title: "Draft Your Team",
                  desc: "Choose up to 12 coaches from 20 experts across 11 domains — find the style that fits YOU.",
                  accent: "#e8633b",
                  emoji: "🏆",
                },
                {
                  icon: Zap,
                  num: "02",
                  title: "Tune Personalities",
                  desc: "Adjust humor, directness, warmth, intensity, and more. Make your fitness coach gentler or your career coach fiercer.",
                  accent: "#f4a261",
                  emoji: "🎛️",
                },
                {
                  icon: MessageCircle,
                  num: "03",
                  title: "Deep Intake Session",
                  desc: "30-minute intake where each coach truly learns who you are — your goals, history, and challenges.",
                  accent: "#e76f51",
                  emoji: "🤝",
                },
                {
                  icon: Clock,
                  num: "04",
                  title: "Always Available",
                  desc: "Chat anytime. Your coaches know your history, your goals, and exactly where you left off.",
                  accent: "#2a9d8f",
                  emoji: "⏰",
                },
                {
                  icon: Sparkles,
                  num: "05",
                  title: "Proactive Check-ins",
                  desc: "Coaches don't just wait — they reach out with motivation, accountability, and thoughtful questions.",
                  accent: "#e9c46a",
                  emoji: "✨",
                },
                {
                  icon: Shield,
                  num: "06",
                  title: "Private & Secure",
                  desc: "Your conversations and personal data stay yours. No sharing, no training on your data. Ever.",
                  accent: "#264653",
                  emoji: "🔒",
                },
              ].map((f, i) => (
                <motion.div
                  key={f.title}
                  variants={fadeUp}
                  custom={i}
                  className="group relative p-6 rounded-2xl border border-border bg-card hover:shadow-md transition-all duration-300 card-warm"
                >
                  <span className="text-2xl absolute top-5 right-5">{f.emoji}</span>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${f.accent}12` }}
                  >
                    <f.icon className="w-5 h-5" style={{ color: f.accent }} />
                  </div>
                  <h3 className="font-semibold text-base mb-2 text-foreground">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── PERSONALITY PREVIEW ─────────────────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 lg:px-10 py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="grid lg:grid-cols-2 gap-12 items-center"
        >
          <motion.div variants={fadeUp} custom={0}>
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-ember mb-3">
              Personalization
            </p>
            <h2 className="font-display text-4xl font-bold leading-tight mb-4 text-foreground">
              Every coach,
              <br />
              tuned to you.
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Six personality sliders let you shape each coach&apos;s vibe. Want your fitness coach
              to be more nurturing? Crank up warmth. Need your career coach to stop sugarcoating?
              Max out directness.
            </p>
            <Link href="/signup">
              <Button variant="outline" className="border-ember/30 text-ember hover:bg-ember/[0.06] rounded-xl">
                Start Building <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>

          <motion.div
            variants={fadeUp}
            custom={1}
            className="relative rounded-2xl border border-border bg-card p-6 space-y-4 card-warm"
          >
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border">
              <CoachAvatar
                name='Marcus "Iron" Chen'
                accentColor="#DC2626"
                personality={{ humor: 40, directness: 85, warmth: 50, intensity: 80, socratic: 30, formality: 40 }}
                size={44}
              />
              <div>
                <p className="font-semibold text-sm text-foreground">Marcus &ldquo;Iron&rdquo; Chen</p>
                <p className="text-xs text-muted-foreground">Strength & Powerlifting</p>
              </div>
            </div>

            {[
              { label: "Humor", low: "🎯", high: "😂", value: 40 },
              { label: "Directness", low: "🌸", high: "⚡", value: 85 },
              { label: "Warmth", low: "🤝", high: "💛", value: 50 },
              { label: "Intensity", low: "🧘", high: "🔥", value: 80 },
            ].map((s) => (
              <div key={s.label} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground font-medium">{s.label}</span>
                  <span className="text-ember font-bold">{s.value}</span>
                </div>
                <div className="relative h-2 rounded-full bg-black/[0.04] overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-ember to-ember-glow"
                    style={{ width: `${s.value}%` }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-ember shadow-lg shadow-ember/20"
                    style={{ left: `calc(${s.value}% - 7px)` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground/60">
                  <span>{s.low}</span>
                  <span>{s.high}</span>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ─── CTA ─────────────────────────────────────── */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 lg:px-10 pb-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="relative rounded-3xl border border-ember/10 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-ember/[0.04] via-transparent to-ember-glow/[0.03]" />
          <div className="absolute inset-0 diagonal-stripe opacity-40" />

          <div className="relative p-10 sm:p-14 text-center">
            <motion.div variants={fadeUp} custom={0} className="flex justify-center mb-4">
              <div className="flex -space-x-2">
                {featured.slice(0, 4).map((c) => (
                  <CoachAvatar
                    key={c.id}
                    name={c.name}
                    accentColor={c.accent_color || "#e8633b"}
                    personality={c.default_personality}
                    size={36}
                    className="border-2 border-card rounded-xl"
                  />
                ))}
                <div className="w-9 h-9 rounded-xl bg-ember flex items-center justify-center text-white text-xs font-bold border-2 border-card shadow-md">
                  +{COACHES.length - 4}
                </div>
              </div>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="font-display text-3xl sm:text-4xl font-bold mb-4 leading-tight text-foreground"
            >
              Stop improving alone.
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-muted-foreground max-w-lg mx-auto mb-8 leading-relaxed"
            >
              Get the expertise, accountability, and support that the world&apos;s most successful
              people have always had.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="flex flex-wrap items-center gap-4 justify-center">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="glow-pulse bg-ember hover:bg-ember/90 text-white text-base px-10 h-13 shadow-xl shadow-ember/20 rounded-xl"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base px-8 h-13 border-border hover:border-ember/20 hover:bg-ember/[0.03] text-foreground rounded-xl"
                >
                  See Pricing
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ─── AI TRANSPARENCY BANNER ─────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 lg:px-10 pb-12">
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-amber-600" />
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-foreground">Honest about what this is</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                CoachSquad coaches are <strong className="text-foreground">AI characters with fictional backgrounds</strong> — not licensed professionals.
                They provide directional guidance powered by AI, not real-world expertise. Having a team of 12
                real coaches would cost $50,000–$500,000+&nbsp;/&nbsp;year. Most people get <em>zero</em> coaching in
                most areas of life. Don&apos;t let the perfect be the enemy of the good.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Use your AI squad to explore ideas, build habits, and prepare better questions for
                the 1–2 real professionals who matter most. <Link href="/disclaimer" className="text-ember hover:text-ember/80 font-medium underline underline-offset-2">Read our full AI disclosure →</Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────── */}
      <footer className="relative z-10 border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-5 h-5 rounded bg-ember/80 flex items-center justify-center">
              <Users className="w-3 h-3 text-white" />
            </div>
            <span>
              Coach<span className="text-ember font-medium">Squad</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-xs text-muted-foreground/60 hover:text-ember transition-colors">
              Pricing
            </Link>
            <Link href="/disclaimer" className="text-xs text-muted-foreground/60 hover:text-ember transition-colors">
              AI Disclosure
            </Link>
            <p className="text-xs text-muted-foreground/60">
              AI coaches — not licensed professionals.
            </p>
          </div>
        </div>
      </footer>

      {/* ─── COACH DETAIL MODAL ──────────────────────── */}
      <AnimatePresence>
        {selectedCoach && (
          <CoachDetailPanel coach={selectedCoach} onClose={() => setSelectedCoach(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
