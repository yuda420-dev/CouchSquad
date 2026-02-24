"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, PhoneOff, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoachAvatar } from "@/components/coach-avatar";
import type { Coach } from "@/lib/supabase/types";
import type { VoiceSessionState } from "@/lib/voice/voice-config";

interface VoiceOverlayProps {
  coach: Coach;
  state: VoiceSessionState;
  isMuted: boolean;
  userTranscript: string;
  coachTranscript: string;
  duration: number;
  error: string | null;
  onStart: () => void;
  onStop: () => void;
  onMute: () => void;
  onUnmute: () => void;
  onClose: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Animated pulsing rings around the coach avatar */
function PulseRings({ color, state }: { color: string; state: VoiceSessionState }) {
  const isActive = state === "listening" || state === "speaking" || state === "connecting";

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border-2"
          style={{ borderColor: color }}
          initial={{ width: 120, height: 120, opacity: 0 }}
          animate={
            isActive
              ? {
                  width: [120, 160 + i * 30],
                  height: [120, 160 + i * 30],
                  opacity: [0.4, 0],
                }
              : { width: 120, height: 120, opacity: 0 }
          }
          transition={{
            duration: 2,
            delay: i * 0.4,
            repeat: isActive ? Infinity : 0,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

/** Animated waveform bars — visual audio indicator */
function VoiceWaveform({ color, active }: { color: string; active: boolean }) {
  const bars = 5;

  return (
    <div className="flex items-center gap-1 h-8">
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className="w-1 rounded-full"
          style={{ backgroundColor: color }}
          animate={
            active
              ? {
                  height: [8, 24 + Math.random() * 8, 12, 28, 8],
                }
              : { height: 8 }
          }
          transition={
            active
              ? {
                  duration: 0.8 + Math.random() * 0.4,
                  delay: i * 0.1,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
              : { duration: 0.3 }
          }
        />
      ))}
    </div>
  );
}

/** Status text based on current state */
function StatusLabel({ state, coachName }: { state: VoiceSessionState; coachName: string }) {
  const labels: Record<VoiceSessionState, string> = {
    idle: "Tap the mic to start",
    connecting: "Connecting...",
    connected: "Connected",
    listening: "Listening...",
    speaking: `${coachName} is speaking`,
    disconnected: "Session ended",
    error: "Connection error",
  };

  return (
    <motion.p
      key={state}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-sm text-muted-foreground"
    >
      {labels[state]}
    </motion.p>
  );
}

export function VoiceOverlay({
  coach,
  state,
  isMuted,
  userTranscript,
  coachTranscript,
  duration,
  error,
  onStart,
  onStop,
  onMute,
  onUnmute,
  onClose,
}: VoiceOverlayProps) {
  const color = coach.accent_color || "#e8633b";
  const isSessionActive = ["connecting", "connected", "listening", "speaking"].includes(state);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex flex-col items-center bg-background/95 backdrop-blur-xl"
    >
      {/* Top bar */}
      <div className="w-full flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: isSessionActive ? "#22c55e" : color,
              boxShadow: isSessionActive ? "0 0 6px #22c55e" : "none",
            }}
          />
          <span className="text-xs font-medium text-muted-foreground">
            Voice {isSessionActive ? `\u00B7 ${formatDuration(duration)}` : ""}
          </span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 max-w-md w-full">
        {/* Coach avatar with pulse rings */}
        <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
          <PulseRings color={color} state={state} />
          <motion.div
            animate={
              state === "speaking"
                ? { scale: [1, 1.05, 1] }
                : { scale: 1 }
            }
            transition={
              state === "speaking"
                ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.3 }
            }
          >
            <CoachAvatar
              name={coach.name}
              accentColor={color}
              avatarUrl={coach.avatar_url}
              personality={coach.default_personality}
              size={120}
            />
          </motion.div>
        </div>

        {/* Coach name */}
        <div className="text-center">
          <h2 className="text-lg font-semibold">{coach.name}</h2>
          <StatusLabel state={state} coachName={coach.name.split(" ")[0]} />
        </div>

        {/* Waveform */}
        <VoiceWaveform color={color} active={state === "speaking" || state === "listening"} />

        {/* Transcript area */}
        <div className="w-full min-h-[80px] max-h-[140px] overflow-y-auto text-center space-y-2">
          <AnimatePresence mode="wait">
            {coachTranscript && state === "speaking" && (
              <motion.p
                key="coach"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-sm text-foreground leading-relaxed"
              >
                {coachTranscript}
              </motion.p>
            )}
            {userTranscript && state === "listening" && (
              <motion.p
                key="user"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-sm text-muted-foreground italic leading-relaxed"
              >
                {userTranscript}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-500 text-center bg-red-500/10 rounded-lg px-4 py-2"
          >
            {error}
          </motion.div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="w-full px-6 pb-8 pt-4">
        <div className="flex items-center justify-center gap-4">
          {!isSessionActive ? (
            // Start / Retry button
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onStart}
              className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg"
              style={{
                backgroundColor: color,
                boxShadow: `0 4px 20px ${color}40`,
              }}
            >
              <Mic className="w-6 h-6" />
            </motion.button>
          ) : (
            // Active session controls
            <>
              {/* Mute toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={isMuted ? onUnmute : onMute}
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                  isMuted
                    ? "bg-red-500/10 border-red-500/30 text-red-500"
                    : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </motion.button>

              {/* End call */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onStop}
                className="w-16 h-16 rounded-full flex items-center justify-center bg-red-500 text-white shadow-lg shadow-red-500/30"
              >
                <PhoneOff className="w-6 h-6" />
              </motion.button>

              {/* Switch to text */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="w-12 h-12 rounded-full flex items-center justify-center bg-secondary border-2 border-border text-muted-foreground hover:text-foreground"
              >
                <MessageCircle className="w-5 h-5" />
              </motion.button>
            </>
          )}
        </div>

        {/* Hint text */}
        <p className="text-center text-[10px] text-muted-foreground mt-4">
          {isSessionActive
            ? "Voice conversations use OpenAI. Standard rates apply."
            : state === "error"
              ? "Check your microphone permissions and try again."
              : "Your conversation will be transcribed and saved to chat."}
        </p>
      </div>
    </motion.div>
  );
}

/** Small microphone button for the chat input area */
export function VoiceTriggerButton({
  onClick,
  accentColor,
  disabled,
}: {
  onClick: () => void;
  accentColor: string;
  disabled?: boolean;
}) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      size="sm"
      variant="ghost"
      className="h-[44px] w-[44px] p-0 rounded-xl text-muted-foreground hover:text-foreground transition-all hover:bg-secondary"
      title="Start voice conversation"
    >
      <Mic className="w-4 h-4" />
    </Button>
  );
}
