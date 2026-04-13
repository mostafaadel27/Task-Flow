"use client";

import { BarChart3, Users, FolderKanban, CheckCircle2, Clock, AlertTriangle, TrendingUp, Loader2 } from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useTeamDashboard } from "@/hooks/useTeamDashboard";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";

function StatCard({ icon: Icon, label, value, color, delay }: { icon: any, label: string, value: string | number, color: string, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className="group border-2 border-border p-6 hover:border-foreground/40 transition-all relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-muted/10 -translate-x-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0" />
      <div className="relative z-10">
        <div className={`inline-flex p-2.5 border mb-4 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <p className="text-3xl md:text-4xl font-black tracking-tighter mb-1">{value}</p>
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</p>
      </div>
    </motion.div>
  );
}

function ProgressBar({ value, max, color = "bg-foreground" }: { value: number, max: number, color?: string }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-3 w-full">
      <div className="flex-1 h-2 bg-muted/30 border border-border/50 overflow-hidden">
        <div className={`h-full ${color} transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-mono font-bold tracking-widest w-10 text-right">{pct}%</span>
    </div>
  );
}

export default function TeamDashboardPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const { workspace, isOwnerOrAdmin } = useWorkspace(workspaceId);
  const { stats, isLoading, error } = useTeamDashboard(workspace?.id);

  if (!isOwnerOrAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center gap-4">
        <BarChart3 className="w-12 h-12 text-muted-foreground/20" />
        <p className="text-sm font-mono uppercase tracking-widest text-muted-foreground">Access Restricted</p>
        <p className="text-xs text-muted-foreground/60 max-w-sm">Team analytics are available for workspace Owners and Admins.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-32 gap-6">
        <Loader2 className="w-8 h-8 animate-[spin_3s_linear_infinite] text-muted-foreground/30" />
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Loading analytics…</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center gap-4">
        <AlertTriangle className="w-8 h-8 text-red-500" />
        <p className="text-sm font-mono uppercase tracking-widest text-red-500/80">Failed to load analytics</p>
      </div>
    );
  }

  const completionRate = stats.total_tasks > 0 ? Math.round((stats.completed_tasks / stats.total_tasks) * 100) : 0;

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4">Team Analytics</h1>
        <p className="text-muted-foreground font-mono text-sm tracking-widest uppercase">
          {workspace?.name} · Performance Overview
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Team Members" value={stats.total_members} color="bg-blue-500/10 text-blue-500 border-blue-500/30" delay={0} />
        <StatCard icon={FolderKanban} label="Projects" value={stats.total_projects} color="bg-amber-500/10 text-amber-500 border-amber-500/30" delay={0.05} />
        <StatCard icon={CheckCircle2} label="Completed" value={stats.completed_tasks} color="bg-emerald-500/10 text-emerald-500 border-emerald-500/30" delay={0.1} />
        <StatCard icon={AlertTriangle} label="Overdue" value={stats.overdue_tasks} color="bg-red-500/10 text-red-500 border-red-500/30" delay={0.15} />
      </div>

      {/* Completion Overview */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="border-2 border-border p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-extrabold uppercase tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Overall Progress
          </h2>
          <span className="text-2xl font-black tracking-tighter">{completionRate}%</span>
        </div>
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="text-center p-4 bg-muted/10 border border-border/50">
            <p className="text-2xl font-black">{stats.total_tasks}</p>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-1">Total Tasks</p>
          </div>
          <div className="text-center p-4 bg-emerald-500/5 border border-emerald-500/20">
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.completed_tasks}</p>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-1">Completed</p>
          </div>
          <div className="text-center p-4 bg-amber-500/5 border border-amber-500/20">
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.pending_tasks}</p>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-1">Pending</p>
          </div>
        </div>
        <ProgressBar value={stats.completed_tasks} max={stats.total_tasks} color="bg-emerald-500" />
      </motion.div>

      {/* Workload Distribution */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="border-2 border-border"
      >
        <div className="p-6 border-b border-border bg-muted/10">
          <h2 className="text-xl font-extrabold uppercase tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5" />
            Workload Distribution
          </h2>
        </div>

        <div className="divide-y divide-border/50">
          {stats.tasks_per_user && stats.tasks_per_user.length > 0 ? (
            stats.tasks_per_user.map((member, i) => {
              const completed = member.completed_tasks || 0;
              const active = member.active_tasks || 0;
              const total = member.total_tasks || 0;

              return (
                <div key={i} className="flex items-center gap-4 p-5 hover:bg-muted/5 transition-colors group">
                  {/* Avatar */}
                  <div className="w-10 h-10 bg-foreground text-background flex items-center justify-center font-bold text-sm uppercase shrink-0">
                    {member.name?.substring(0, 2) || "??"}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-extrabold uppercase tracking-tight truncate">{member.name}</h3>
                        <p className="text-[10px] font-mono text-muted-foreground truncate">{member.email}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 border border-border bg-muted/20">
                          {total} tasks
                        </span>
                      </div>
                    </div>

                    {/* Bar Chart */}
                    <div className="flex items-center gap-1 h-3">
                      {completed > 0 && (
                        <div
                          className="h-full bg-emerald-500 transition-all duration-700"
                          style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
                          title={`${completed} completed`}
                        />
                      )}
                      {active > 0 && (
                        <div
                          className="h-full bg-amber-500 transition-all duration-700"
                          style={{ width: `${total > 0 ? (active / total) * 100 : 0}%` }}
                          title={`${active} active`}
                        />
                      )}
                      {total === 0 && (
                        <div className="h-full bg-muted/30 w-full border border-border/30" />
                      )}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
                        <span className="w-2 h-2 bg-emerald-500 inline-block" /> {completed} done
                      </span>
                      <span className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
                        <span className="w-2 h-2 bg-amber-500 inline-block" /> {active} active
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center">
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">No task data available</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
