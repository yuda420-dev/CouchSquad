import { NavSidebar, MobileNav } from "@/components/nav-sidebar";
import { AppShell } from "@/components/app-shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <div className="flex min-h-screen">
        <NavSidebar />
        <main className="flex-1 min-w-0 overflow-y-auto">
          <MobileNav />
          {children}
        </main>
      </div>
    </AppShell>
  );
}
