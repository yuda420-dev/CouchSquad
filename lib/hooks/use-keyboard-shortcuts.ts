"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  description: string;
  action: () => void;
}

/**
 * Global keyboard shortcuts for power-user navigation.
 *
 * Shortcuts:
 * - Cmd+K or Ctrl+K: Focus search (if on page with search)
 * - g then d: Go to Discover
 * - g then s: Go to Squad
 * - g then g: Go to Goals
 * - g then j: Go to Journal
 * - g then i: Go to Inbox
 * - g then h: Go to History
 * - g then r: Go to Weekly Review
 * - g then m: Go to Memories
 * - g then a: Go to Activity
 * - g then p: Go to Insights
 * - g then f: Go to For You
 * - g then t: Go to Settings
 * - Escape: Close modals/overlays
 * - ?: Show shortcuts help
 */
export function useKeyboardShortcuts({
  onShowHelp,
}: {
  onShowHelp?: () => void;
} = {}) {
  const router = useRouter();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // ? — Show help
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onShowHelp?.();
        return;
      }

      // Handle "g" prefix navigation
      if (e.key === "g" && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
        // Set up a one-time listener for the next key
        const handleNext = (nextE: KeyboardEvent) => {
          const nextTarget = nextE.target as HTMLElement;
          if (
            nextTarget.tagName === "INPUT" ||
            nextTarget.tagName === "TEXTAREA"
          )
            return;

          const routes: Record<string, string> = {
            o: "/home",
            d: "/discover",
            s: "/roster",
            g: "/goals",
            j: "/journal",
            i: "/inbox",
            h: "/history",
            r: "/weekly-review",
            m: "/memories",
            a: "/activity",
            p: "/insights",
            f: "/recommendations",
            t: "/settings",
            k: "/achievements",
            l: "/timeline",
          };

          const route = routes[nextE.key];
          if (route) {
            nextE.preventDefault();
            router.push(route);
          }

          // Always remove the listener
          window.removeEventListener("keydown", handleNext);
          clearTimeout(timeout);
        };

        // Auto-cancel after 1.5s
        const timeout = setTimeout(() => {
          window.removeEventListener("keydown", handleNext);
        }, 1500);

        window.addEventListener("keydown", handleNext, { once: true });
        return;
      }
    },
    [router, onShowHelp]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

/** Helper: list all shortcuts for display in help modal */
export const SHORTCUTS = [
  { keys: "g o", description: "Go to Home" },
  { keys: "g d", description: "Go to Discover" },
  { keys: "g s", description: "Go to My Squad" },
  { keys: "g g", description: "Go to Goals" },
  { keys: "g j", description: "Go to Journal" },
  { keys: "g i", description: "Go to Inbox" },
  { keys: "g h", description: "Go to History" },
  { keys: "g r", description: "Go to Weekly Review" },
  { keys: "g m", description: "Go to Memories" },
  { keys: "g a", description: "Go to Activity" },
  { keys: "g p", description: "Go to Insights" },
  { keys: "g f", description: "Go to For You" },
  { keys: "g k", description: "Go to Achievements" },
  { keys: "g l", description: "Go to Timeline" },
  { keys: "g t", description: "Go to Settings" },
  { keys: "?", description: "Show keyboard shortcuts" },
];
