"use client";

import { useState, useEffect } from "react";
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
  Menu,
  X,
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

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
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
    <>
      {/* Logo */}
      <Link href="/home" className="flex items-center gap-3 px-5 py-5" onClick={onNavigate}>
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
      <nav className="flex-1 px-3 space-y-0.5 mt-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all relative group",
                isActive
                  ? "bg-ember/[0.06] text-ember"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-ember" />
              )}

              <item.icon className={cn("w-[18px] h-[18px] shrink-0", isActive && "drop-shadow-[0_0_4px_rgba(232,99,59,0.4)]")} />
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
    </>
  );
}

/** Desktop sidebar — hidden on mobile */
export function NavSidebar() {
  return (
    <aside className="hidden md:flex w-64 h-screen sticky top-0 border-r border-border bg-sidebar/80 backdrop-blur-xl flex-col">
      <SidebarContent />
    </aside>
  );
}

/** Mobile top bar + slide-out drawer */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Find current page label
  const current = navItems.find(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b border-border bg-background/90 backdrop-blur-xl">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-secondary transition-colors"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5 text-foreground" />
        </button>

        <Link href="/home" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-ember flex items-center justify-center shadow-md shadow-ember/15">
            <Users className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight text-foreground">
            Coach<span className="text-ember">Squad</span>
          </span>
        </Link>

        {/* Current page indicator */}
        <div className="w-10 h-10 flex items-center justify-center">
          {current && <current.icon className="w-5 h-5 text-muted-foreground" />}
        </div>
      </header>

      {/* Backdrop */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-out drawer */}
      <aside
        className={cn(
          "md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-background border-r border-border flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Close button */}
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors"
          aria-label="Close navigation"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <SidebarContent onNavigate={() => setOpen(false)} />
      </aside>
    </>
  );
}
