"use client";

import { use, useState, useEffect } from "react";
import { COACHES } from "@/lib/coaches/catalog";
import { ChatInterface, type ChatMessage } from "@/components/chat-interface";
import { CoachAvatar } from "@/components/coach-avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings2, Loader2 } from "lucide-react";
import Link from "next/link";
import type { Coach } from "@/lib/supabase/types";

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const coaches = COACHES as unknown as Coach[];
  const coach = coaches.find((c) => c.id === id);

  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [initialMessages, setInitialMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // On mount: get or create conversation + load existing messages
  useEffect(() => {
    if (!coach) return;

    async function initConversation() {
      try {
        // Step 1: Get or create conversation
        const convRes = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ coachId: coach!.id }),
        });

        if (convRes.ok) {
          const { conversation } = await convRes.json();
          setConversationId(conversation.id);

          // Step 2: Load existing messages
          const msgRes = await fetch(
            `/api/conversations?conversationId=${conversation.id}`
          );
          if (msgRes.ok) {
            const { messages } = await msgRes.json();
            if (messages?.length) {
              setInitialMessages(
                messages.map((m: { id: string; role: string; content: string; created_at: string }) => ({
                  id: m.id,
                  role: m.role as "user" | "assistant",
                  content: m.content,
                  createdAt: m.created_at,
                }))
              );
            }
          }
        }
      } catch (err) {
        console.error("Failed to init conversation:", err);
        // Chat still works without persistence — just won't save to DB
      } finally {
        setLoading(false);
      }
    }

    initConversation();
  }, [coach]);

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

  const accentColor = coach.accent_color || "#e8633b";

  return (
    <div className="flex flex-col h-screen">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-card/50">
        <Link
          href="/roster"
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <CoachAvatar
          name={coach.name}
          accentColor={accentColor}
          personality={coach.default_personality}
          size={32}
        />
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-sm truncate">{coach.name}</h2>
          <p className="text-xs text-muted-foreground truncate">
            {coach.sub_domain || coach.domain}
          </p>
        </div>
        <Link href={`/coach/${id}`}>
          <Button variant="ghost" size="sm">
            <Settings2 className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* Chat area */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading conversation...</p>
          </div>
        </div>
      ) : (
        <ChatInterface
          coach={coach}
          conversationId={conversationId}
          initialMessages={initialMessages}
        />
      )}
    </div>
  );
}
