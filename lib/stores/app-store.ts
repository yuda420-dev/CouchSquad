import { create } from "zustand";
import type { Coach, UserRoster, Profile, Touchpoint } from "@/lib/supabase/types";

interface AppState {
  // User
  profile: Profile | null;
  setProfile: (p: Profile | null) => void;

  // Coaches
  coaches: Coach[];
  setCoaches: (c: Coach[]) => void;

  // Roster
  roster: UserRoster[];
  setRoster: (r: UserRoster[]) => void;
  addToRoster: (item: UserRoster) => void;
  removeFromRoster: (coachId: string) => void;

  // Inbox
  unreadTouchpoints: Touchpoint[];
  setUnreadTouchpoints: (t: Touchpoint[]) => void;

  // UI
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),

  coaches: [],
  setCoaches: (coaches) => set({ coaches }),

  roster: [],
  setRoster: (roster) => set({ roster }),
  addToRoster: (item) =>
    set((state) => ({ roster: [...state.roster, item] })),
  removeFromRoster: (coachId) =>
    set((state) => ({
      roster: state.roster.filter((r) => r.coach_id !== coachId),
    })),

  unreadTouchpoints: [],
  setUnreadTouchpoints: (unreadTouchpoints) => set({ unreadTouchpoints }),

  sidebarOpen: true,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}));
