"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  Users,
  Compass,
  LayoutGrid,
  Inbox,
  BarChart3,
  Settings,
  LogOut,
  BookOpen,
  Target,
  Clock,
  Handshake,
  Activity,
  Trophy,
  Sparkles,
  Brain,
  CalendarDays,
  Flame,
  Home,
  GitBranch,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/stores/app-store";

const navItems = [
  { href: "/home", icon: Home, label: "Home" },
  { href: "/discover", icon: Compass, label: "Discover" },
  { href: "/recommendations", icon: Sparkles, label: "For You" },
  { href: "/roster", icon: LayoutGrid, label: "My Squad" },
  { href: "/goals", icon: Target, label: "Goals" },
  { href: "/journal", icon: BookOpen, label: "Journal" },
  { href: "/inbox", icon: Inbox, label: "Inbox" },
  { href: "/history", icon: Clock, label: "History" },
  { href: "/huddle", icon: Handshake, label: "Huddle" },
  { href: "/memories", icon: Brain, label: "Memories" },
  { href: "/habits", icon: Flame, label: "Habits" },
  { href: "/activity", icon: Activity, label: "Activity" },
  { href: "/insights", icon: BarChart3, label: "Insights" },
  { href: "/weekly-review", icon: CalendarDays, label: "Review" },
  { href: "/timeline", icon: GitBranch, label: "Timeline" },
  { href: "/achievements", icon: Trophy, label: "Achievements" },
  { href: "/privacy", icon: Shield, label: "Privacy" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function NavSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const unreadCount = useAppStore((s) => s.unreadTouchpoints.length);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="w-64 h-screen sticky top-0 border-r border-border bg-sidebar/80 backdrop-blur-xl flex flex-col">
      {/* Logo */}
      <Link href="/home" className="flex items-center gap-3 px-5 py-5">
        <div className="w-9 h-9 rounded-xl bg-ember flex items-center justify-center shadow-lg shadow-ember/15">
          <Users className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight text-foreground">
          Coach<span className="text-ember">Squad</span>
        </span>
      </Link>

      {/* Divider */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-border to-transparent mb-2" />

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5 mt-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative group",
                isActive
                  ? "bg-ember/[0.06] text-ember"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-ember" />
              )}

              <item.icon className={cn("w-[18px] h-[18px]", isActive && "drop-shadow-[0_0_4px_rgba(232,99,59,0.4)]")} />
              {item.label}

              {/* Inbox badge */}
              {item.href === "/inbox" && unreadCount > 0 && (
                <span className="absolute right-3 bg-ember text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md shadow-ember/20">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-3">
        <div className="mx-1 h-px bg-gradient-to-r from-transparent via-border to-transparent mb-3" />
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground/60 hover:text-foreground hover:bg-secondary rounded-xl h-10"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
