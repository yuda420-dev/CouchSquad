"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { COACHES } from "@/lib/coaches/catalog";
import { CoachCard } from "@/components/coach-card";
import { DomainFilter } from "@/components/domain-filter";
import { Input } from "@/components/ui/input";
import { MAX_ROSTER_SIZE } from "@/lib/utils/constants";
import { Search, Users } from "lucide-react";
import { useAppStore } from "@/lib/stores/app-store";
import { toast } from "sonner";
import type { Coach, UserRoster } from "@/lib/supabase/types";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

export default function DiscoverPage() {
  const [domainFilter, setDomainFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const roster = useAppStore((s) => s.roster);
  const addToRoster = useAppStore((s) => s.addToRoster);
  const removeFromRoster = useAppStore((s) => s.removeFromRoster);

  // Use local catalog for now (later: fetch from Supabase)
  const coaches = COACHES as unknown as Coach[];

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

  const rosterIds = new Set(roster.map((r) => r.coach_id));

  function handleToggleRoster(coachId: string) {
    if (rosterIds.has(coachId)) {
      removeFromRoster(coachId);
      toast.success("Removed from your squad");
    } else {
      if (roster.length >= MAX_ROSTER_SIZE) {
        toast.error(`Your squad is full! Maximum ${MAX_ROSTER_SIZE} coaches.`);
        return;
      }
      const newItem: UserRoster = {
        id: crypto.randomUUID(),
        user_id: "",
        coach_id: coachId,
        added_at: new Date().toISOString(),
        is_active: true,
        intake_completed: false,
        last_interaction: null,
      };
      addToRoster(newItem);
      toast.success("Drafted to your squad!");
    }
  }

  return (
    <div className="relative min-h-screen">
      {/* Background effects */}
      <div className="fixed inset-0 dot-bg pointer-events-none opacity-30" />

      <div className="relative z-10 p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="mb-8"
        >
          <motion.div variants={fadeUp} custom={0}>
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-ember mb-2">
              Coach Catalog
            </p>
          </motion.div>
          <motion.h1
            variants={fadeUp}
            custom={1}
            className="font-display text-3xl sm:text-4xl font-bold mb-2 text-foreground"
          >
            Discover Your Coaches
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} className="text-muted-foreground">
            Browse {coaches.length} expert coaches across{" "}
            {new Set(coaches.map((c) => c.domain)).size} domains.
          </motion.p>
        </motion.div>

        {/* Roster count + search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 mb-6"
        >
          {/* Roster pill */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border shadow-sm">
              <div className="flex -space-x-1">
                {Array.from({ length: Math.min(roster.length, 4) }).map((_, i) => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded-full bg-ember/50 border-2 border-card"
                    style={{ zIndex: 4 - i }}
                  />
                ))}
                {roster.length === 0 && (
                  <div className="w-5 h-5 rounded-full border border-dashed border-muted-foreground/30" />
                )}
              </div>
              <span className="text-sm">
                <span className="text-foreground font-semibold">{roster.length}</span>
                <span className="text-muted-foreground">/{MAX_ROSTER_SIZE}</span>
              </span>
              <span className="text-xs text-muted-foreground/60">drafted</span>
            </div>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <Input
              placeholder="Search coaches, domains, specialties..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-border focus:border-ember/30 rounded-xl h-10 shadow-sm"
            />
          </div>
        </motion.div>

        {/* Domain filter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <DomainFilter selected={domainFilter} onSelect={setDomainFilter} />
        </motion.div>

        {/* Results header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {filtered.length} coach{filtered.length !== 1 ? "es" : ""}{" "}
            {domainFilter && (
              <span>
                in <span className="text-foreground font-medium">{domainFilter}</span>
              </span>
            )}
          </p>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7 text-muted-foreground/40" />
            </div>
            <p className="text-lg font-medium text-foreground">No coaches found</p>
            <p className="text-sm mt-1 text-muted-foreground">
              Try a different search or filter
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((coach, i) => (
              <CoachCard
                key={coach.id}
                coach={coach}
                isOnRoster={rosterIds.has(coach.id)}
                onToggleRoster={handleToggleRoster}
                index={i}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
