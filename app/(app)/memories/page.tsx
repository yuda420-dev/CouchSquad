"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/lib/stores/app-store";
import { CoachAvatarSmall } from "@/components/coach-avatar";
import {
  Brain,
  Loader2,
  Trash2,
  Pencil,
  Check,
  X,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COACHES } from "@/lib/coaches/catalog";
import type { Coach, CoachMemory } from "@/lib/supabase/types";

const CATEGORY_COLORS: Record<string, string> = {
  personal: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  goal: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  preference: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  achievement: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  challenge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function MemoriesPage() {
  const roster = useAppStore((s) => s.roster);
  const coaches = COACHES as unknown as Coach[];
  const [memories, setMemories] = useState<CoachMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCoach, setFilterCoach] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const url = filterCoach
        ? `/api/memories?coachId=${filterCoach}`
        : "/api/memories";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMemories(data.memories || []);
      }
    } catch {
      // Non-critical
    } finally {
      setLoading(false);
    }
  }, [filterCoach]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const handleDelete = useCallback(
    async (id: string) => {
      // Optimistic
      setMemories((prev) => prev.filter((m) => m.id !== id));
      setDeletingId(null);

      try {
        await fetch("/api/memories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete", memoryId: id }),
        });
      } catch {
        load(); // Revert
      }
    },
    [load]
  );

  const handleEdit = useCallback(
    async (id: string) => {
      if (!editText.trim()) return;

      // Optimistic
      setMemories((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, fact: editText.trim() } : m
        )
      );
      setEditingId(null);

      try {
        await fetch("/api/memories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update",
            memoryId: id,
            fact: editText.trim(),
          }),
        });
      } catch {
        load(); // Revert
      }
    },
    [editText, load]
  );

  // Filter memories
  const filtered = memories.filter((m) => {
    if (filterCategory && m.category !== filterCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!m.fact.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Group by coach
  const grouped: Record<string, CoachMemory[]> = {};
  for (const m of filtered) {
    if (!grouped[m.coach_id]) grouped[m.coach_id] = [];
    grouped[m.coach_id].push(m);
  }

  const categories = ["personal", "goal", "preference", "achievement", "challenge"];

  // Coaches on roster for filter
  const rosterCoaches = roster
    .map((r) => coaches.find((c) => c.id === r.coach_id))
    .filter(Boolean) as Coach[];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
          <Brain className="w-8 h-8 text-ember" />
          Coach Memories
        </h1>
        <p className="text-muted-foreground text-sm">
          Everything your coaches know about you. Edit or delete anything.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search memories..."
          className="w-60"
        />

        {/* Coach filter */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFilterCoach(null)}
            className={`text-xs px-2.5 py-1.5 rounded-full transition-colors ${
              !filterCoach
                ? "bg-ember/10 text-ember"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
          {rosterCoaches.map((c) => (
            <button
              key={c.id}
              onClick={() =>
                setFilterCoach(filterCoach === c.id ? null : c.id)
              }
              className={`text-xs px-2.5 py-1.5 rounded-full transition-colors flex items-center gap-1 ${
                filterCoach === c.id
                  ? "bg-ember/10 text-ember"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <CoachAvatarSmall
                name={c.name}
                accentColor={c.accent_color || "#e8633b"}
                size={16}
              />
              {c.name.split(" ")[0]}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-1 ml-auto">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() =>
                setFilterCategory(filterCategory === cat ? null : cat)
              }
              className={`text-[10px] px-2 py-1 rounded-full capitalize transition-colors ${
                filterCategory === cat
                  ? CATEGORY_COLORS[cat]
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="text-xs text-muted-foreground mb-4">
        {filtered.length} memor{filtered.length === 1 ? "y" : "ies"}
        {filterCoach || filterCategory || search
          ? ` (filtered from ${memories.length})`
          : ""}
      </div>

      {loading ? (
        <div className="text-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Loading memories...
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Brain className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No memories found.</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Have conversations with your coaches and they&apos;ll start
            remembering things about you.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([coachId, coachMemories]) => {
            const coach = coaches.find((c) => c.id === coachId);
            if (!coach) return null;

            return (
              <section key={coachId}>
                <div className="flex items-center gap-2 mb-3">
                  <CoachAvatarSmall
                    name={coach.name}
                    accentColor={coach.accent_color || "#e8633b"}
                    size={28}
                  />
                  <h2 className="text-sm font-semibold">{coach.name}</h2>
                  <span className="text-xs text-muted-foreground">
                    {coachMemories.length} memor
                    {coachMemories.length === 1 ? "y" : "ies"}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {coachMemories.map((memory) => {
                    const isEditing = editingId === memory.id;
                    const isDeleting = deletingId === memory.id;

                    return (
                      <div
                        key={memory.id}
                        className="group flex items-start gap-2 rounded-lg border border-border/30 bg-card px-3 py-2 hover:border-border/60 transition-colors"
                      >
                        {/* Category badge */}
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-full capitalize mt-0.5 shrink-0 ${
                            CATEGORY_COLORS[memory.category || "personal"]
                          }`}
                        >
                          {memory.category || "note"}
                        </span>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <Input
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="h-7 text-sm"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter")
                                    handleEdit(memory.id);
                                  if (e.key === "Escape")
                                    setEditingId(null);
                                }}
                              />
                              <button
                                onClick={() => handleEdit(memory.id)}
                                className="p-1 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="p-1 text-muted-foreground hover:bg-secondary rounded"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <p className="text-sm leading-snug">
                              {memory.fact}
                            </p>
                          )}
                          <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                            {new Date(memory.created_at).toLocaleDateString()} via{" "}
                            {memory.source || "conversation"}
                          </p>
                        </div>

                        {/* Actions */}
                        {!isEditing && (
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button
                              onClick={() => {
                                setEditingId(memory.id);
                                setEditText(memory.fact);
                              }}
                              className="p-1 text-muted-foreground/40 hover:text-foreground rounded"
                              title="Edit"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>

                            {isDeleting ? (
                              <div className="flex items-center gap-0.5">
                                <button
                                  onClick={() =>
                                    handleDelete(memory.id)
                                  }
                                  className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-[10px]"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => setDeletingId(null)}
                                  className="p-1 text-muted-foreground hover:bg-secondary rounded"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() =>
                                  setDeletingId(memory.id)
                                }
                                className="p-1 text-muted-foreground/40 hover:text-red-500 rounded"
                                title="Delete"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
