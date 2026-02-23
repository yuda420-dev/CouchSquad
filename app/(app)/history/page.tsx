"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAppStore } from "@/lib/stores/app-store";
import { COACHES } from "@/lib/coaches/catalog";
import { CoachAvatarSmall } from "@/components/coach-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  MessageCircle,
  Bookmark,
  BookmarkCheck,
  Clock,
  Loader2,
  X,
  ChevronRight,
  Mic,
  ClipboardList,
  Filter,
} from "lucide-react";
import Link from "next/link";
import type { Coach, Conversation, Bookmark as BookmarkType } from "@/lib/supabase/types";

interface SearchResult {
  message_id: string;
  conversation_id: string;
  coach_id: string;
  role: string;
  content: string;
  created_at: string;
  conversation_type: string;
}

type ViewMode = "conversations" | "search" | "bookmarks";

const CONV_TYPE_ICONS: Record<string, { icon: typeof MessageCircle; label: string }> = {
  chat: { icon: MessageCircle, label: "Chat" },
  intake: { icon: ClipboardList, label: "Intake" },
  voice: { icon: Mic, label: "Voice" },
};

export default function HistoryPage() {
  const roster = useAppStore((s) => s.roster);
  const coaches = COACHES as unknown as Coach[];

  const [viewMode, setViewMode] = useState<ViewMode>("conversations");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterCoach, setFilterCoach] = useState<string | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterCoach) params.set("coachId", filterCoach);

      const res = await fetch(`/api/conversations?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch {
      // Non-critical
    } finally {
      setLoading(false);
    }
  }, [filterCoach]);

  // Load bookmarks
  const loadBookmarks = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterCoach) params.set("coachId", filterCoach);

      const res = await fetch(`/api/bookmarks?${params.toString()}`);
      if (res.ok) {
        const { bookmarks: bm } = await res.json();
        setBookmarks(bm || []);
      }
    } catch {
      // Non-critical
    }
  }, [filterCoach]);

  useEffect(() => {
    loadConversations();
    loadBookmarks();
  }, [loadConversations, loadBookmarks]);

  // Debounced search
  const doSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    try {
      const params = new URLSearchParams({ q: query });
      if (filterCoach) params.set("coachId", filterCoach);

      const res = await fetch(`/api/conversations/search?${params.toString()}`);
      if (res.ok) {
        const { results } = await res.json();
        setSearchResults(results || []);
      }
    } catch {
      // Non-critical
    } finally {
      setSearching(false);
    }
  }, [filterCoach]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.trim().length >= 2) {
      setViewMode("search");
    }

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => doSearch(value.trim()), 400);
  };

  const handleRemoveBookmark = async (bookmarkId: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
    try {
      await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", bookmarkId }),
      });
    } catch {
      loadBookmarks();
    }
  };

  const rosterCoaches = roster
    .map((r) => coaches.find((c) => c.id === r.coach_id))
    .filter(Boolean) as Coach[];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Clock className="w-8 h-8 text-ember" />
          History
        </h1>
        <p className="text-muted-foreground text-sm">
          Search conversations, browse past sessions, and find bookmarked advice.
        </p>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search all conversations..."
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery("");
              setSearchResults([]);
              setViewMode("conversations");
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* View mode tabs + Coach filter */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex gap-1">
          {([
            { mode: "conversations" as const, label: "Conversations", icon: MessageCircle },
            { mode: "bookmarks" as const, label: `Bookmarks${bookmarks.length ? ` (${bookmarks.length})` : ""}`, icon: Bookmark },
          ]).map((tab) => (
            <button
              key={tab.mode}
              onClick={() => {
                setViewMode(tab.mode);
                setSearchQuery("");
                setSearchResults([]);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                viewMode === tab.mode
                  ? "bg-ember text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <tab.icon className="w-3 h-3" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Coach filter */}
        {rosterCoaches.length > 1 && (
          <div className="flex items-center gap-1 ml-auto">
            <Filter className="w-3 h-3 text-muted-foreground" />
            <select
              value={filterCoach || ""}
              onChange={(e) => setFilterCoach(e.target.value || null)}
              className="text-xs bg-transparent border-none text-muted-foreground cursor-pointer"
            >
              <option value="">All coaches</option>
              {rosterCoaches.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Content */}
      {viewMode === "search" ? (
        <SearchResults
          results={searchResults}
          query={searchQuery}
          searching={searching}
          coaches={coaches}
        />
      ) : viewMode === "bookmarks" ? (
        <BookmarksList
          bookmarks={bookmarks}
          coaches={coaches}
          onRemove={handleRemoveBookmark}
        />
      ) : loading ? (
        <div className="text-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading conversations...</p>
        </div>
      ) : conversations.length === 0 ? (
        <EmptyHistory />
      ) : (
        <ConversationsList conversations={conversations} coaches={coaches} />
      )}
    </div>
  );
}

function ConversationsList({ conversations, coaches }: { conversations: Conversation[]; coaches: Coach[] }) {
  // Group by coach
  const grouped = new Map<string, Conversation[]>();
  for (const c of conversations) {
    const list = grouped.get(c.coach_id) || [];
    list.push(c);
    grouped.set(c.coach_id, list);
  }

  return (
    <div className="space-y-6">
      {Array.from(grouped.entries()).map(([coachId, convos]) => {
        const coach = coaches.find((c) => c.id === coachId);
        if (!coach) return null;

        return (
          <div key={coachId}>
            <div className="flex items-center gap-2 mb-2">
              <CoachAvatarSmall name={coach.name} accentColor={coach.accent_color || "#e8633b"} size={24} />
              <h3 className="text-sm font-semibold">{coach.name}</h3>
              <span className="text-[10px] text-muted-foreground">
                {convos.length} conversation{convos.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="space-y-1 ml-8">
              {convos.map((convo) => {
                const typeInfo = CONV_TYPE_ICONS[convo.conversation_type] || CONV_TYPE_ICONS.chat;
                const TypeIcon = typeInfo.icon;
                return (
                  <Link
                    key={convo.id}
                    href={`/coach/${coachId}/chat`}
                    className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <TypeIcon className="w-3.5 h-3.5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        {convo.title || `${typeInfo.label} session`}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {convo.message_count} messages
                        {convo.last_message_at && (
                          <> · {formatRelativeTime(convo.last_message_at)}</>
                        )}
                      </p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SearchResults({
  results,
  query,
  searching,
  coaches,
}: {
  results: SearchResult[];
  query: string;
  searching: boolean;
  coaches: Coach[];
}) {
  if (searching) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Searching...</p>
      </div>
    );
  }

  if (query.length < 2) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        Type at least 2 characters to search.
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No results for &ldquo;{query}&rdquo;
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-3">
        {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
      </p>
      {results.map((r) => {
        const coach = coaches.find((c) => c.id === r.coach_id);
        // Highlight match
        const idx = r.content.toLowerCase().indexOf(query.toLowerCase());
        const start = Math.max(0, idx - 60);
        const end = Math.min(r.content.length, idx + query.length + 60);
        const snippet =
          (start > 0 ? "..." : "") +
          r.content.slice(start, end) +
          (end < r.content.length ? "..." : "");

        return (
          <Link
            key={r.message_id}
            href={`/coach/${r.coach_id}/chat`}
            className="block p-3 rounded-xl border border-border/50 hover:border-border/80 bg-card transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              {coach && (
                <CoachAvatarSmall name={coach.name} accentColor={coach.accent_color || "#e8633b"} size={20} />
              )}
              <span className="text-xs font-medium">{r.role === "user" ? "You" : coach?.name || "Coach"}</span>
              <Badge variant="outline" className="text-[9px] px-1 py-0">
                {r.conversation_type}
              </Badge>
              <span className="text-[10px] text-muted-foreground ml-auto">
                {formatRelativeTime(r.created_at)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {highlightText(snippet, query)}
            </p>
          </Link>
        );
      })}
    </div>
  );
}

function BookmarksList({
  bookmarks,
  coaches,
  onRemove,
}: {
  bookmarks: BookmarkType[];
  coaches: Coach[];
  onRemove: (id: string) => void;
}) {
  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
          <Bookmark className="w-7 h-7 text-amber-500" />
        </div>
        <h2 className="text-lg font-semibold mb-2">No bookmarks yet</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Bookmark important advice from your coaches during conversations. They&apos;ll appear here for easy reference.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {bookmarks.map((bm) => {
        const coach = coaches.find((c) => c.id === bm.coach_id);
        return (
          <div
            key={bm.id}
            className="flex gap-3 p-3 rounded-xl border border-amber-200/50 bg-amber-50/30"
          >
            <BookmarkCheck className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {coach && (
                  <>
                    <CoachAvatarSmall name={coach.name} accentColor={coach.accent_color || "#e8633b"} size={18} />
                    <span className="text-xs font-medium">{coach.name}</span>
                  </>
                )}
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {formatRelativeTime(bm.created_at)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{bm.content_preview}</p>
              {bm.note && (
                <p className="text-xs text-amber-700 mt-1 italic">&ldquo;{bm.note}&rdquo;</p>
              )}
            </div>
            <button
              onClick={() => onRemove(bm.id)}
              className="text-muted-foreground/40 hover:text-red-500 transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function EmptyHistory() {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 rounded-2xl bg-ember/10 flex items-center justify-center mx-auto mb-4">
        <Clock className="w-8 h-8 text-ember" />
      </div>
      <h2 className="text-xl font-semibold mb-2">No conversations yet</h2>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
        Start chatting with your coaches and your history will appear here.
      </p>
      <Link href="/roster">
        <Button className="bg-ember hover:bg-ember/90 text-white">Go to My Squad</Button>
      </Link>
    </div>
  );
}

function highlightText(text: string, query: string) {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${escapeRegex(query)})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-amber-200 text-amber-900 rounded px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
