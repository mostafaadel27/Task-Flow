"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { LayoutDashboard, FolderKanban, Settings, Users, ClipboardList, BarChart3, ChevronDown, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { WorkspaceRole } from "@/types/database";
import { hasPermission, Permission } from "@/lib/permissions";
import { useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: any;
  shortcut: string;
  requiredPermission?: Permission;
  showForAll?: boolean;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, shortcut: "D", showForAll: true },
  { href: "/projects", label: "Projects", icon: FolderKanban, shortcut: "P", requiredPermission: "create_projects" },
  { href: "/workspace", label: "My Tasks", icon: ClipboardList, shortcut: "W", showForAll: true },
  { href: "/team", label: "Team", icon: Users, shortcut: "T", showForAll: true },
  { href: "/analytics", label: "Analytics", icon: BarChart3, shortcut: "A", requiredPermission: "view_team_dashboard" },
  { href: "/settings", label: "Settings", icon: Settings, shortcut: "S", showForAll: true },
];

export function SidebarNav({ workspaces }: { workspaces: any[] }) {
  const pathname = usePathname();
  const params = useParams();
  const workspaceId = (params.workspaceId as string) || workspaces[0]?.workspaceId;
  const currentWorkspace = workspaces.find(w => w.workspaceId === workspaceId) || workspaces[0];
  const role = currentWorkspace?.role as WorkspaceRole;

  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);

  const visibleItems = navItems.filter(item => {
    if (item.showForAll) return true;
    if (item.requiredPermission && role) {
      return hasPermission(role, item.requiredPermission);
    }
    return false;
  });

  return (
    <nav className="flex-1 overflow-y-auto py-6 px-4">
      {/* Workspace Switcher */}
      <div className="mb-8">
        <div className="text-xs font-mono tracking-widest text-muted-foreground uppercase mb-3 px-3">Workspace</div>
        <button 
          onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors group"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-6 h-6 rounded bg-foreground/10 flex items-center justify-center font-bold text-[10px] shrink-0">
              {currentWorkspace?.workspaceName?.charAt(0)}
            </div>
            <span className="text-sm font-bold truncate">{currentWorkspace?.workspaceName}</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isWorkspaceOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isWorkspaceOpen && (
          <div className="mt-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
            {workspaces.map(ws => (
              <Link
                key={ws.workspaceId}
                href={`/ws/${ws.workspaceId}/dashboard`}
                onClick={() => setIsWorkspaceOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-colors ${
                  ws.workspaceId === workspaceId ? 'bg-foreground/5 font-bold' : 'hover:bg-muted/50 text-muted-foreground'
                }`}
              >
                <div className="w-4 h-4 rounded bg-muted flex items-center justify-center text-[8px]">
                  {ws.workspaceName?.charAt(0)}
                </div>
                {ws.workspaceName}
              </Link>
            ))}
            <div className="h-[1px] bg-border/30 mx-2 my-2" />
            <Link
              href="/onboarding"
              onClick={() => setIsWorkspaceOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors font-medium border border-dashed border-border/50 mx-1"
            >
              <Plus className="w-4 h-3" />
              Create Workspace
            </Link>
          </div>
        )}
      </div>

      <div className="text-xs font-mono tracking-widest text-muted-foreground uppercase mb-6 px-3">Menu</div>
      <ul className="space-y-1 text-sm font-medium" role="list">
        {visibleItems.map(({ href, label, icon: Icon, shortcut }) => {
          const fullHref = `/ws/${workspaceId}${href}`;
          const isActive = pathname === fullHref || (pathname.startsWith(fullHref + "/") && href !== "/dashboard");

          return (
            <li key={href} className="relative">
              <Link 
                href={fullHref} 
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors group relative z-10 ${
                  isActive 
                    ? "text-foreground font-bold" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-transform duration-300 ease-out group-hover:scale-110 ${isActive ? 'text-foreground' : 'text-muted-foreground'}`} aria-hidden="true" />
                  {label}
                </div>
                <div className="hidden group-hover:flex items-center justify-center w-5 h-5 rounded uppercase text-[10px] font-mono text-muted-foreground border border-border bg-background shadow-xs transition-opacity">
                  {shortcut}
                </div>
              </Link>
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-indicator"
                  className="absolute inset-0 bg-muted/80 rounded-lg border border-border z-0 shadow-sm"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
