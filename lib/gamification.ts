/**
 * Gamification — Achievements, Badges, and Milestone Tracking
 *
 * Computed client-side from existing data (no new DB tables needed).
 * Checks are run when the achievements page loads.
 */

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // emoji
  category: "sessions" | "streaks" | "goals" | "journal" | "squad" | "voice" | "special";
  earned: boolean;
  progress?: number; // 0-100
  earnedAt?: string;
}

interface AchievementInput {
  totalSessions: number;
  totalMessages: number;
  coachesOnRoster: number;
  intakesCompleted: number;
  activeGoals: number;
  completedGoals: number;
  journalEntries: number;
  journalStreak: number;
  moodEntries: number;
  voiceSessions: number;
  bookmarks: number;
  activityLogs: number;
  domains: string[];
  firstSessionDate?: string;
}

export function computeAchievements(input: AchievementInput): Achievement[] {
  const achievements: Achievement[] = [];

  // ── Session milestones ──
  achievements.push({
    id: "first-session",
    title: "First Steps",
    description: "Have your first coaching session",
    icon: "👋",
    category: "sessions",
    earned: input.totalSessions >= 1,
    progress: Math.min(100, (input.totalSessions / 1) * 100),
  });

  achievements.push({
    id: "sessions-10",
    title: "Getting Serious",
    description: "Complete 10 coaching sessions",
    icon: "💪",
    category: "sessions",
    earned: input.totalSessions >= 10,
    progress: Math.min(100, (input.totalSessions / 10) * 100),
  });

  achievements.push({
    id: "sessions-50",
    title: "Committed",
    description: "Complete 50 coaching sessions",
    icon: "🏆",
    category: "sessions",
    earned: input.totalSessions >= 50,
    progress: Math.min(100, (input.totalSessions / 50) * 100),
  });

  achievements.push({
    id: "sessions-100",
    title: "Centurion",
    description: "Complete 100 coaching sessions",
    icon: "👑",
    category: "sessions",
    earned: input.totalSessions >= 100,
    progress: Math.min(100, (input.totalSessions / 100) * 100),
  });

  achievements.push({
    id: "messages-500",
    title: "Conversationalist",
    description: "Exchange 500 messages with your coaches",
    icon: "💬",
    category: "sessions",
    earned: input.totalMessages >= 500,
    progress: Math.min(100, (input.totalMessages / 500) * 100),
  });

  // ── Squad milestones ──
  achievements.push({
    id: "first-coach",
    title: "Draft Day",
    description: "Add your first coach to the squad",
    icon: "🤝",
    category: "squad",
    earned: input.coachesOnRoster >= 1,
    progress: Math.min(100, (input.coachesOnRoster / 1) * 100),
  });

  achievements.push({
    id: "full-squad-3",
    title: "Building the Team",
    description: "Have 3 coaches on your squad",
    icon: "👥",
    category: "squad",
    earned: input.coachesOnRoster >= 3,
    progress: Math.min(100, (input.coachesOnRoster / 3) * 100),
  });

  achievements.push({
    id: "full-squad-5",
    title: "Full Squad",
    description: "Have 5 coaches on your squad",
    icon: "🌟",
    category: "squad",
    earned: input.coachesOnRoster >= 5,
    progress: Math.min(100, (input.coachesOnRoster / 5) * 100),
  });

  achievements.push({
    id: "first-intake",
    title: "Open Book",
    description: "Complete your first intake session",
    icon: "📋",
    category: "squad",
    earned: input.intakesCompleted >= 1,
    progress: Math.min(100, (input.intakesCompleted / 1) * 100),
  });

  achievements.push({
    id: "multi-domain",
    title: "Renaissance Person",
    description: "Have coaches across 3+ different life domains",
    icon: "🎭",
    category: "squad",
    earned: input.domains.length >= 3,
    progress: Math.min(100, (input.domains.length / 3) * 100),
  });

  // ── Goal milestones ──
  achievements.push({
    id: "first-goal",
    title: "Goal Setter",
    description: "Set your first goal",
    icon: "🎯",
    category: "goals",
    earned: input.activeGoals + input.completedGoals >= 1,
    progress: Math.min(100, ((input.activeGoals + input.completedGoals) / 1) * 100),
  });

  achievements.push({
    id: "goal-completed",
    title: "Mission Accomplished",
    description: "Complete your first goal",
    icon: "✅",
    category: "goals",
    earned: input.completedGoals >= 1,
    progress: Math.min(100, (input.completedGoals / 1) * 100),
  });

  achievements.push({
    id: "goals-5-completed",
    title: "Goal Crusher",
    description: "Complete 5 goals",
    icon: "🔥",
    category: "goals",
    earned: input.completedGoals >= 5,
    progress: Math.min(100, (input.completedGoals / 5) * 100),
  });

  // ── Journal milestones ──
  achievements.push({
    id: "first-journal",
    title: "Dear Diary",
    description: "Write your first journal entry",
    icon: "📖",
    category: "journal",
    earned: input.journalEntries >= 1,
    progress: Math.min(100, (input.journalEntries / 1) * 100),
  });

  achievements.push({
    id: "journal-streak-7",
    title: "Week Warrior",
    description: "Maintain a 7-day journal streak",
    icon: "🔥",
    category: "streaks",
    earned: input.journalStreak >= 7,
    progress: Math.min(100, (input.journalStreak / 7) * 100),
  });

  achievements.push({
    id: "journal-streak-30",
    title: "Monthly Maven",
    description: "Maintain a 30-day journal streak",
    icon: "⭐",
    category: "streaks",
    earned: input.journalStreak >= 30,
    progress: Math.min(100, (input.journalStreak / 30) * 100),
  });

  achievements.push({
    id: "mood-tracker",
    title: "Self-Aware",
    description: "Log your mood 10 times",
    icon: "🌈",
    category: "journal",
    earned: input.moodEntries >= 10,
    progress: Math.min(100, (input.moodEntries / 10) * 100),
  });

  // ── Voice milestones ──
  achievements.push({
    id: "voice-debut",
    title: "Voice Debut",
    description: "Have your first voice conversation",
    icon: "🎙️",
    category: "voice",
    earned: input.voiceSessions >= 1,
    progress: Math.min(100, (input.voiceSessions / 1) * 100),
  });

  achievements.push({
    id: "voice-regular",
    title: "Voice Regular",
    description: "Have 10 voice conversations",
    icon: "🎧",
    category: "voice",
    earned: input.voiceSessions >= 10,
    progress: Math.min(100, (input.voiceSessions / 10) * 100),
  });

  // ── Special ──
  achievements.push({
    id: "bookworm",
    title: "Bookworm",
    description: "Bookmark 5 pieces of coach advice",
    icon: "📌",
    category: "special",
    earned: input.bookmarks >= 5,
    progress: Math.min(100, (input.bookmarks / 5) * 100),
  });

  achievements.push({
    id: "activity-tracker",
    title: "Activity Tracker",
    description: "Log 10 activities (workouts, meals, etc.)",
    icon: "📊",
    category: "special",
    earned: input.activityLogs >= 10,
    progress: Math.min(100, (input.activityLogs / 10) * 100),
  });

  return achievements;
}

/** Get summary stats from achievements */
export function getAchievementSummary(achievements: Achievement[]) {
  const earned = achievements.filter((a) => a.earned);
  const total = achievements.length;

  return {
    earned: earned.length,
    total,
    percentage: Math.round((earned.length / total) * 100),
    recentlyEarned: earned.slice(0, 3),
  };
}
