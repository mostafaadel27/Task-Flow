import { redirect } from "next/navigation";
import Link from "next/link";
import { Layers, LogOut, Menu, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/UserAvatar";
import { SidebarNav } from "@/components/SidebarNav";
import { NotificationBell } from "@/components/NotificationBell";
import { ThemeToggle } from "@/components/ThemeToggle";

import { logout } from "@/app/auth/actions";
import { createClient } from "@/utils/supabase/server";
import { getUserWorkspaces } from "@/lib/auth-utils";
import { ShortcutHandler } from "@/components/ShortcutHandler";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch workspaces - Do not auto-create
  const workspaces = await getUserWorkspaces();

  // If no workspaces, we are in onboarding mode
  const isOnboarding = workspaces.length === 0;

  // Handle name/avatar for UI
  const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
  const avatarUrl = user.user_metadata?.avatar_url;

  // If onboarding, show a simplified layout
  if (isOnboarding) {
    return (
      <div className="min-h-screen bg-background flex flex-col selection:bg-foreground selection:text-background font-sans">
        <ShortcutHandler />
        <main className="flex-1 w-full flex flex-col">
          {children}
        </main>
      </div>
    );
  }

  // Full Dashboard Layout
  return (
    <div className="flex h-screen bg-background overflow-hidden selection:bg-foreground selection:text-background font-sans">
      <ShortcutHandler />
      
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border/50 bg-background/50 backdrop-blur-xl" role="navigation" aria-label="Main navigation">
        <div className="h-20 flex items-center justify-between px-6 border-b border-border/50">
          <Link href={`/ws/${workspaces[0].workspaceId}/dashboard`} className="flex items-center gap-3 group relative" aria-label="TaskFlow home">
            <Layers className="w-6 h-6 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300" aria-hidden="true" />
            <span className="font-extrabold tracking-tight uppercase text-lg relative">
              TaskFlow
              <span className="absolute -right-2.5 top-0 flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-foreground/20 opacity-75"></span>
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-foreground/10"></span>
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <NotificationBell />
          </div>
        </div>
        
        <SidebarNav workspaces={workspaces} />
        
        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-muted/50 border border-border/50 mb-2 relative group/user">
            <UserAvatar url={avatarUrl} name={name} className="w-8 h-8 font-mono text-xs shadow-sm ring-1 ring-border group-hover/user:ring-foreground/20 transition-all" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-bold truncate block dark:text-foreground">{name}</span>
              <span className="text-xs text-muted-foreground font-mono truncate block opacity-70">{user.email || "Member"}</span>
            </div>
            <span className="absolute left-1 top-1 w-1.5 h-1.5 bg-emerald-500 rounded-full border border-background shadow-[0_0_5px_rgba(16,185,129,0.5)] animate-pulse" aria-hidden="true" />
          </div>
          <form action={logout}>
            <button type="submit" className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors group">
              <div className="flex items-center gap-3">
                <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" aria-hidden="true" />
                Log out
              </div>
              <div className="hidden group-hover:flex items-center gap-1 opacity-50">
                <Command className="w-3 h-3" />
                <span className="text-[10px] uppercase font-mono">Q</span>
              </div>
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-muted/10">
        {/* Mobile Header */}
        <header className="md:hidden h-16 flex items-center justify-between px-6 border-b border-border bg-background">
          <Link href={`/ws/${workspaces[0].workspaceId}/dashboard`} className="flex items-center gap-3" aria-label="TaskFlow home">
            <Layers className="w-5 h-5" aria-hidden="true" />
            <span className="font-extrabold uppercase tracking-tight">TaskFlow</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Open menu">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-10 lg:p-16">
          <div className="max-w-6xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
