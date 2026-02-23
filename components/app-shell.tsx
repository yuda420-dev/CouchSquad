"use client";

import { useState, useEffect, useCallback } from "react";
import { useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { KeyboardShortcutsDialog } from "@/components/keyboard-shortcuts-dialog";
import { useAppStore } from "@/lib/stores/app-store";
import { createClient } from "@/lib/supabase/client";

/**
 * Client-side shell for global behaviors: keyboard shortcuts, store hydration, etc.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const setProfile = useAppStore((s) => s.setProfile);
  const setRoster = useAppStore((s) => s.setRoster);
  const setUnreadTouchpoints = useAppStore((s) => s.setUnreadTouchpoints);

  useKeyboardShortcuts({
    onShowHelp: () => setShowShortcuts(true),
  });

  // Hydrate global store on mount
  const hydrate = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch profile, roster, and unread touchpoints in parallel
      const sb = supabase as any;
      const [profileRes, rosterRes, touchpointsRes] = await Promise.all([
        sb.from("profiles").select("*").eq("id", user.id).single(),
        sb.from("user_roster").select("*").eq("user_id", user.id).eq("is_active", true),
        sb.from("touchpoints").select("*").eq("user_id", user.id).in("status", ["pending", "delivered"]).is("read_at", null),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (rosterRes.data) setRoster(rosterRes.data);
      if (touchpointsRes.data) setUnreadTouchpoints(touchpointsRes.data);
    } catch {
      // Non-critical — pages handle their own data loading too
    }
  }, [setProfile, setRoster, setUnreadTouchpoints]);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showShortcuts) {
        setShowShortcuts(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showShortcuts]);

  return (
    <>
      {children}
      <KeyboardShortcutsDialog
        open={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </>
  );
}
