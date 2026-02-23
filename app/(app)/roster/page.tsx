"use client";

import { useAppStore } from "@/lib/stores/app-store";
import { COACHES } from "@/lib/coaches/catalog";
import { CoachCard } from "@/components/coach-card";
import { MAX_ROSTER_SIZE } from "@/lib/utils/constants";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import Link from "next/link";
import type { Coach } from "@/lib/supabase/types";
import { toast } from "sonner";

export default function RosterPage() {
  const roster = useAppStore((s) => s.roster);
  const removeFromRoster = useAppStore((s) => s.removeFromRoster);
  const coaches = COACHES as unknown as Coach[];

  const rosterCoaches = roster
    .map((r) => ({
      ...r,
      coach: coaches.find((c) => c.id === r.coach_id),
    }))
    .filter((r) => r.coach);

  const emptySlots = MAX_ROSTER_SIZE - roster.length;

  function handleRemove(coachId: string) {
    removeFromRoster(coachId);
    toast.success("Removed from your squad");
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Squad</h1>
        <p className="text-muted-foreground">
          Your personal team of {roster.length} coach{roster.length !== 1 ? "es" : ""}.
          {emptySlots > 0 && ` ${emptySlots} slot${emptySlots !== 1 ? "s" : ""} remaining.`}
        </p>
      </div>

      {roster.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-ember/10 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-ember" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Your squad is empty</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Browse our catalog of expert coaches and build your dream team.
            Add up to {MAX_ROSTER_SIZE} coaches across any domains.
          </p>
          <Link href="/discover">
            <Button className="bg-ember hover:bg-ember/90 text-white shadow-lg shadow-ember/20">
              <Plus className="w-4 h-4 mr-2" /> Browse Coaches
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
            {rosterCoaches.map(({ coach, ...rosterItem }) => (
              <CoachCard
                key={coach!.id}
                coach={coach!}
                isOnRoster={true}
                onToggleRoster={handleRemove}
              />
            ))}

            {/* Empty slots */}
            {Array.from({ length: emptySlots }).map((_, i) => (
              <Link
                key={`empty-${i}`}
                href="/discover"
                className="rounded-xl border-2 border-dashed border-border/50 hover:border-ember/30 transition-colors flex flex-col items-center justify-center py-12 text-muted-foreground hover:text-ember"
              >
                <Plus className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium">Add Coach</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
