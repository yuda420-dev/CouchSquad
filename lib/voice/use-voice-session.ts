"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { VoiceSessionState } from "./voice-config";

interface UseVoiceSessionOptions {
  coachId: string;
  onTranscript?: (text: string, role: "user" | "assistant") => void;
  onStateChange?: (state: VoiceSessionState) => void;
  onError?: (error: string) => void;
}

interface VoiceSessionReturn {
  state: VoiceSessionState;
  start: () => Promise<void>;
  stop: () => void;
  mute: () => void;
  unmute: () => void;
  isMuted: boolean;
  userTranscript: string;
  coachTranscript: string;
  error: string | null;
  /** Total seconds the session has been active */
  duration: number;
}

/**
 * React hook for managing a WebRTC voice session with OpenAI Realtime API.
 *
 * Flow:
 * 1. `start()` — fetches ephemeral token from our API
 * 2. Creates RTCPeerConnection with OpenAI's SDP offer
 * 3. Captures microphone via getUserMedia
 * 4. Establishes bidirectional audio stream
 * 5. Receives transcripts via RTCDataChannel
 * 6. `stop()` — tears down connection + releases media
 */
export function useVoiceSession({
  coachId,
  onTranscript,
  onStateChange,
  onError,
}: UseVoiceSessionOptions): VoiceSessionReturn {
  const [state, setState] = useState<VoiceSessionState>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [userTranscript, setUserTranscript] = useState("");
  const [coachTranscript, setCoachTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync state changes to callback
  const updateState = useCallback(
    (newState: VoiceSessionState) => {
      setState(newState);
      onStateChange?.(newState);
    },
    [onStateChange]
  );

  // Duration timer
  useEffect(() => {
    if (state === "connected" || state === "listening" || state === "speaking") {
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state]);

  const start = useCallback(async () => {
    if (state !== "idle" && state !== "disconnected" && state !== "error") return;

    setError(null);
    setUserTranscript("");
    setCoachTranscript("");
    setDuration(0);
    updateState("connecting");

    try {
      // Step 1: Get ephemeral token from our server
      const tokenRes = await fetch("/api/voice/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coachId }),
      });

      if (!tokenRes.ok) {
        const err = await tokenRes.json();
        throw new Error(err.error || "Failed to create voice session");
      }

      const { token, model } = await tokenRes.json();

      if (!token) {
        throw new Error("No token received from server");
      }

      // Step 2: Create RTCPeerConnection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Step 3: Set up audio playback for remote (coach) audio
      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      audioRef.current = audioEl;

      pc.ontrack = (event) => {
        audioEl.srcObject = event.streams[0];
      };

      // Step 4: Create data channel for events/transcripts
      const dc = pc.createDataChannel("oai-events");
      dataChannelRef.current = dc;

      dc.onopen = () => {
        updateState("connected");
        // Short delay then transition to listening
        setTimeout(() => updateState("listening"), 500);
      };

      dc.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          handleRealtimeEvent(msg);
        } catch {
          // Ignore malformed messages
        }
      };

      dc.onclose = () => {
        updateState("disconnected");
      };

      // Step 5: Get microphone access
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = mediaStream;

      // Add mic track to peer connection
      mediaStream.getTracks().forEach((track) => {
        pc.addTrack(track, mediaStream);
      });

      // Step 6: Create SDP offer and connect to OpenAI
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpRes = await fetch(`https://api.openai.com/v1/realtime?model=${model}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/sdp",
        },
        body: offer.sdp,
      });

      if (!sdpRes.ok) {
        throw new Error(`WebRTC negotiation failed: ${sdpRes.statusText}`);
      }

      const answerSdp = await sdpRes.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

      // Connection established! Audio flows directly browser ↔ OpenAI

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to start voice session";
      setError(msg);
      onError?.(msg);
      updateState("error");
      cleanup();
    }
  }, [coachId, state, updateState, onError]);

  /** Handle incoming Realtime API events from the data channel */
  const handleRealtimeEvent = useCallback(
    (event: Record<string, unknown>) => {
      const type = event.type as string;

      switch (type) {
        // Coach finished speaking — we got the full transcript
        case "response.audio_transcript.done": {
          const transcript = (event as { transcript?: string }).transcript || "";
          setCoachTranscript(transcript);
          onTranscript?.(transcript, "assistant");
          updateState("listening");
          break;
        }

        // User's speech was transcribed
        case "conversation.item.input_audio_transcription.completed": {
          const transcript = (event as { transcript?: string }).transcript || "";
          setUserTranscript(transcript);
          onTranscript?.(transcript, "user");
          break;
        }

        // Coach is starting to speak
        case "response.audio.delta": {
          if (state !== "speaking") {
            updateState("speaking");
          }
          break;
        }

        // Response completed
        case "response.done": {
          updateState("listening");
          break;
        }

        // Error from Realtime API
        case "error": {
          const errorEvent = event as { error?: { message?: string } };
          const errMsg = errorEvent.error?.message || "Voice session error";
          setError(errMsg);
          onError?.(errMsg);
          break;
        }

        // Session created confirmation
        case "session.created":
        case "session.updated":
          // These are informational — no action needed
          break;

        default:
          // Other events (input_audio_buffer.speech_started, etc.)
          if (type === "input_audio_buffer.speech_started") {
            // User started talking
            setUserTranscript("");
          }
          break;
      }
    },
    [onTranscript, onError, state, updateState]
  );

  const cleanup = useCallback(() => {
    // Stop media tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Close data channel
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }

    // Close peer connection
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    // Clean up audio element
    if (audioRef.current) {
      audioRef.current.srcObject = null;
      audioRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    cleanup();
    updateState("disconnected");
  }, [cleanup, updateState]);

  const mute = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });
      setIsMuted(true);
    }
  }, []);

  const unmute = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = true;
      });
      setIsMuted(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    state,
    start,
    stop,
    mute,
    unmute,
    isMuted,
    userTranscript,
    coachTranscript,
    error,
    duration,
  };
}
