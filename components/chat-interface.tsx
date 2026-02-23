"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Bookmark, BookmarkCheck, Copy, Check, SmilePlus } from "lucide-react";
import { CoachAvatar } from "@/components/coach-avatar";
import { RichMessage } from "@/components/rich-message";
import { VoiceOverlay, VoiceTriggerButton } from "@/components/voice-session-ui";
import { useVoiceSession } from "@/lib/voice/use-voice-session";
import type { Coach } from "@/lib/supabase/types";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  /** Whether this message was from a voice session */
  isVoice?: boolean;
}

interface ChatInterfaceProps {
  coach: Coach;
  initialMessages?: ChatMessage[];
  conversationId?: string;
}

const VOICE_ENABLED = process.env.NEXT_PUBLIC_VOICE_ENABLED === "true";

export function ChatInterface({ coach, initialMessages = [], conversationId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [voiceMode, setVoiceMode] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [reactions, setReactions] = useState<Record<string, string[]>>({});
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Collect voice transcripts to append to chat when session ends
  const voiceTranscriptsRef = useRef<ChatMessage[]>([]);

  // Voice session hook
  const voice = useVoiceSession({
    coachId: coach.id,
    onTranscript: (text, role) => {
      if (text.trim()) {
        const msg: ChatMessage = {
          id: crypto.randomUUID(),
          role,
          content: text.trim(),
          createdAt: new Date().toISOString(),
          isVoice: true,
        };
        voiceTranscriptsRef.current.push(msg);
      }
    },
    onStateChange: (newState) => {
      // When voice session ends, append transcripts to chat
      if (newState === "disconnected") {
        const transcripts = voiceTranscriptsRef.current;
        if (transcripts.length > 0) {
          setMessages((prev) => [...prev, ...transcripts]);
          voiceTranscriptsRef.current = [];
        }
      }
    },
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsStreaming(true);
    setStreamingContent("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coachId: coach.id,
          conversationId,
          message: userMessage.content,
          history: messages.slice(-20).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error("Failed to send message");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          const lines = text.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === "text") {
                  fullContent += data.text;
                  setStreamingContent(fullContent);
                } else if (data.type === "error") {
                  throw new Error(data.error);
                }
              } catch {
                // Skip malformed JSON
              }
            }
          }
        }
      }

      // Finalize assistant message
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: fullContent,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingContent("");
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Something went wrong";
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Sorry, I encountered an error: ${errMsg}. Please try again.`,
          createdAt: new Date().toISOString(),
        },
      ]);
      setStreamingContent("");
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  }, [input, isStreaming, coach.id, conversationId, messages]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const handleStartVoice = useCallback(() => {
    voiceTranscriptsRef.current = [];
    setVoiceMode(true);
    voice.start();
  }, [voice]);

  const handleStopVoice = useCallback(() => {
    voice.stop();
    // Don't close overlay immediately — let disconnected state show briefly
    setTimeout(() => setVoiceMode(false), 800);
  }, [voice]);

  const handleCloseVoice = useCallback(() => {
    if (voice.state !== "idle" && voice.state !== "disconnected" && voice.state !== "error") {
      voice.stop();
    }
    setVoiceMode(false);
  }, [voice]);

  const handleBookmark = useCallback(async (msg: ChatMessage) => {
    const isBookmarked = bookmarkedIds.has(msg.id);

    if (isBookmarked) {
      // Remove bookmark — would need bookmark ID, for now just toggle visual
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        next.delete(msg.id);
        return next;
      });
    } else {
      setBookmarkedIds((prev) => new Set(prev).add(msg.id));
      try {
        await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "add",
            messageId: msg.id,
            coachId: coach.id,
            contentPreview: msg.content,
          }),
        });
      } catch {
        // Revert on failure
        setBookmarkedIds((prev) => {
          const next = new Set(prev);
          next.delete(msg.id);
          return next;
        });
      }
    }
  }, [bookmarkedIds, coach.id]);

  const handleCopy = useCallback((msg: ChatMessage) => {
    navigator.clipboard.writeText(msg.content);
    setCopiedId(msg.id);
    setTimeout(() => setCopiedId(null), 1500);
  }, []);

  const QUICK_REACTIONS = ["👍", "❤️", "😂", "🔥", "💡", "🙏"];

  const handleReaction = useCallback(
    async (msgId: string, emoji: string) => {
      const current = reactions[msgId] || [];
      const hasReaction = current.includes(emoji);

      // Optimistic update
      setReactions((prev) => {
        const existing = prev[msgId] || [];
        if (hasReaction) {
          return { ...prev, [msgId]: existing.filter((e) => e !== emoji) };
        }
        return { ...prev, [msgId]: [...existing, emoji] };
      });
      setShowReactionPicker(null);

      try {
        await fetch("/api/reactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: hasReaction ? "remove" : "add",
            messageId: msgId,
            conversationId,
            emoji,
          }),
        });
      } catch {
        // Revert on failure
        setReactions((prev) => ({
          ...prev,
          [msgId]: hasReaction
            ? [...(prev[msgId] || []), emoji]
            : (prev[msgId] || []).filter((e) => e !== emoji),
        }));
      }
    },
    [reactions, conversationId]
  );

  const allMessages = [
    ...messages,
    ...(streamingContent
      ? [{ id: "streaming", role: "assistant" as const, content: streamingContent, createdAt: "" }]
      : []),
  ];

  const accentColor = coach.accent_color || "#e8633b";

  return (
    <div className="flex flex-col h-full relative">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {allMessages.length === 0 && (
          <div className="text-center py-20">
            <div className="mx-auto mb-4">
              <CoachAvatar
                name={coach.name}
                accentColor={accentColor}
                personality={coach.default_personality}
                size={64}
                className="mx-auto"
              />
            </div>
            <h2 className="text-lg font-semibold mb-1">{coach.name}</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              {coach.tagline || "Ready to chat. Send a message to get started."}
            </p>
            {VOICE_ENABLED && (
              <p className="text-muted-foreground/60 text-xs mt-2">
                You can also tap the mic to start a voice conversation.
              </p>
            )}
          </div>
        )}

        {allMessages.map((msg) => {
          const isBookmarked = bookmarkedIds.has(msg.id);
          const isCopied = copiedId === msg.id;
          const isAssistant = msg.role === "assistant";
          const isStreamingMsg = msg.id === "streaming";

          return (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2 group`}
            >
              {isAssistant && (
                <div className="shrink-0 mt-1">
                  <CoachAvatar
                    name={coach.name}
                    accentColor={accentColor}
                    personality={coach.default_personality}
                    size={32}
                  />
                </div>
              )}
              <div className="relative">
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-ember/10 text-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  }`}
                >
                  {/* Voice indicator */}
                  {"isVoice" in msg && msg.isVoice && (
                    <span className="text-[10px] text-muted-foreground/60 block mb-1">
                      🎙 Voice
                    </span>
                  )}
                  {isAssistant && !isStreamingMsg ? (
                    <RichMessage content={msg.content} />
                  ) : (
                    msg.content
                  )}
                  {isStreamingMsg && (
                    <span className="inline-block w-1.5 h-4 bg-ember ml-0.5 animate-pulse" />
                  )}
                </div>

                {/* Reactions display */}
                {(reactions[msg.id] || []).length > 0 && (
                  <div className="flex gap-0.5 mt-1">
                    {reactions[msg.id].map((emoji, ri) => (
                      <button
                        key={ri}
                        onClick={() => handleReaction(msg.id, emoji)}
                        className="text-xs px-1.5 py-0.5 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                {/* Action buttons on hover — only for completed messages */}
                {!isStreamingMsg && (
                  <div className="absolute -bottom-5 left-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isAssistant && (
                      <button
                        onClick={() => handleBookmark(msg)}
                        className={`p-1 rounded transition-colors ${
                          isBookmarked
                            ? "text-amber-500"
                            : "text-muted-foreground/40 hover:text-amber-500"
                        }`}
                        title={isBookmarked ? "Bookmarked" : "Bookmark this"}
                      >
                        {isBookmarked ? (
                          <BookmarkCheck className="w-3 h-3" />
                        ) : (
                          <Bookmark className="w-3 h-3" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => handleCopy(msg)}
                      className="p-1 rounded text-muted-foreground/40 hover:text-foreground transition-colors"
                      title="Copy"
                    >
                      {isCopied ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                    <button
                      onClick={() =>
                        setShowReactionPicker(
                          showReactionPicker === msg.id ? null : msg.id
                        )
                      }
                      className="p-1 rounded text-muted-foreground/40 hover:text-foreground transition-colors"
                      title="React"
                    >
                      <SmilePlus className="w-3 h-3" />
                    </button>

                    {/* Quick reaction picker */}
                    {showReactionPicker === msg.id && (
                      <div className="absolute bottom-6 left-0 flex gap-0.5 bg-card border border-border rounded-lg px-1.5 py-1 shadow-lg z-10">
                        {QUICK_REACTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleReaction(msg.id, emoji)}
                            className="text-sm hover:scale-125 transition-transform px-0.5"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="border-t border-border/50 p-4">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${coach.name}...`}
            className="min-h-[44px] max-h-[200px] resize-none"
            rows={1}
            disabled={isStreaming}
          />
          {VOICE_ENABLED && (
            <VoiceTriggerButton
              onClick={handleStartVoice}
              accentColor={accentColor}
              disabled={isStreaming}
            />
          )}
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming}
            className="bg-ember hover:bg-ember/90 text-white shrink-0 h-[44px] w-[44px] p-0"
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-center text-[10px] text-muted-foreground mt-2">
          {coach.name} is an AI character — not a licensed professional. For guidance, not a substitute for expert advice.{" "}
          <a href="/disclaimer" className="underline underline-offset-2 hover:text-ember/60">
            Learn more
          </a>
        </p>
      </div>

      {/* Voice overlay */}
      <AnimatePresence>
        {voiceMode && (
          <VoiceOverlay
            coach={coach}
            state={voice.state}
            isMuted={voice.isMuted}
            userTranscript={voice.userTranscript}
            coachTranscript={voice.coachTranscript}
            duration={voice.duration}
            error={voice.error}
            onStart={voice.start}
            onStop={handleStopVoice}
            onMute={voice.mute}
            onUnmute={voice.unmute}
            onClose={handleCloseVoice}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
