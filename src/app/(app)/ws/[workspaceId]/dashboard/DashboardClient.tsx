"use client";

import Link from "next/link";
import { ArrowRight, CircleDashed, FolderKanban, CheckCircle2, MoveRight, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { useWorkspace } from "@/hooks/useWorkspace";

interface DashboardClientProps {
  name: string;
  totalProjects: number;
  activeTasks: number;
  completedTasks: number;
  recentProjects: any[];
  allProjects: any[];
  upNextTasks: any[];
  isNewUser: boolean;
  role: string | null;
  workspaceId: string;
}

export function DashboardClient({
  name,
  totalProjects,
  activeTasks,
  completedTasks,
  recentProjects,
  allProjects,
  upNextTasks,
  isNewUser,
  role,
  workspaceId,
}: DashboardClientProps) {
  const { workspace } = useWorkspace(workspaceId);
  const activeWorkspaceId = workspace?.id;
  
  const container: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { ease: [0.16, 1, 0.3, 1] as [number, number, number, number], duration: 0.6 } }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-16 pb-12"
    >
      <motion.div variants={item} className="flex flex-col gap-2 border-b border-border/50 pb-8">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter uppercase leading-none">
          {name}'s Workspace
        </h1>
        <span className="text-sm font-mono text-muted-foreground uppercase tracking-widest mt-2">
          Command Center
        </span>
      </motion.div>

      {/* Metrics */}
      {!isNewUser && (
        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-border/50 p-6 flex flex-col justify-between bg-muted/5 group hover:bg-muted/10 transition-colors">
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">Total Projects</span>
            <span className="text-[4rem] font-bold tracking-tighter leading-none group-hover:pl-2 transition-all duration-300">{totalProjects}</span>
          </div>
          <div className="border border-border/50 p-6 flex flex-col justify-between bg-muted/5 group hover:bg-muted/10 transition-colors">
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">In Progress</span>
            <span className="text-[4rem] font-bold tracking-tighter leading-none group-hover:pl-2 transition-all duration-300">{activeTasks}</span>
          </div>
          <div className="border border-border/50 p-6 flex flex-col justify-between bg-muted/5 group hover:bg-muted/10 transition-colors bg-foreground text-background">
            <span className="text-xs font-mono uppercase tracking-widest opacity-60 mb-4">Completed</span>
            <span className="text-[4rem] font-bold tracking-tighter leading-none group-hover:pl-2 transition-all duration-300">{completedTasks}</span>
          </div>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-2 gap-12 lg:gap-8">
        {/* Projects list */}
        <motion.section variants={item} className="space-y-6">
          <div className="flex items-end justify-between border-b border-border/50 pb-4">
            <h2 className="text-xl font-extrabold uppercase tracking-tight">Active Projects</h2>
            <Link href={role === 'member' ? `/ws/${workspaceId}/workspace` : `/ws/${workspaceId}/projects`} className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors group flex items-center gap-2">
              View all <MoveRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {totalProjects === 0 ? (
            <div className="py-12 border-2 border-dashed border-border/50 text-center bg-muted/5">
              <FolderKanban className="w-6 h-6 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                {role === 'member' ? 'NO MISSIONS ASSIGNED' : 'NO PROJECTS INITIALIZED'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recentProjects.map((project: any) => {
                const pTasks = project.tasks || [];
                const pCompleted = pTasks.filter((t: any) => t.status === 'done').length;
                const progress = pTasks.length === 0 ? 0 : Math.round((pCompleted / pTasks.length) * 100);
                
                return (
                  <Link key={project.id} href={`/ws/${workspaceId}/board/${project.id}`} className="group block">
                    <div className="p-4 border border-border/50 bg-background hover:border-foreground/30 transition-colors flex items-center gap-4 relative overflow-hidden">
                      <div className="flex-1 min-w-0 relative z-10">
                        <h3 className="font-bold uppercase tracking-tight truncate group-hover:text-primary transition-colors">{project.title}</h3>
                        <p className="text-xs font-mono text-muted-foreground mt-1 tracking-wider uppercase">
                          {pCompleted}/{pTasks.length} TSK
                        </p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 relative z-10">
                        <div className="w-16 bg-muted h-1 overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={`${project.title} progress`}>
                          <div 
                            className="bg-foreground h-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" 
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-muted-foreground w-8 text-right block">{progress}%</span>
                      </div>
                      <div className="absolute inset-0 bg-muted/30 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] z-0" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </motion.section>

        {/* Up next */}
        <motion.section variants={item} className="space-y-6">
          <div className="flex items-end justify-between border-b border-border/50 pb-4">
            <h2 className="text-xl font-extrabold uppercase tracking-tight">Priority Queue</h2>
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Top 5</span>
          </div>
          
          {upNextTasks.length === 0 ? (
            <div className="py-12 border-2 border-dashed border-border/50 text-center bg-muted/5 flex flex-col items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-muted-foreground/30 mb-4" />
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                {role === 'member' ? 'ALL MISSIONS COMPLETE' : 'QUEUE CLEAR'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {upNextTasks.map((task: any) => {
                const project = allProjects?.find((p: any) => p.id === task.project_id);
                return (
                  <div key={task.id} className="p-4 border border-border/50 bg-background flex items-center justify-between group hover:border-foreground/30 transition-colors cursor-default">
                    <div className="flex items-center gap-4 min-w-0">
                      <CircleDashed className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                      <div className="flex flex-col min-w-0">
                        <p className="text-sm font-bold uppercase tracking-tight truncate">{task.title}</p>
                        <p className="text-[10px] font-mono text-muted-foreground truncate uppercase tracking-widest mt-0.5">{project?.title || 'Unknown Project'}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-mono border px-2 py-1 uppercase tracking-widest shrink-0 ${
                      task.priority === 'high' ? 'border-foreground text-foreground bg-foreground/5' :
                      task.priority === 'medium' ? 'border-border text-muted-foreground bg-muted/20' :
                      'border-border/50 text-muted-foreground/50 opacity-50'
                    }`}>
                      {task.priority || 'medium'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.section>
      </div>

      {/* Global Activity Monitor (Owner/Admin Only) */}
      {(role === 'owner' || role === 'admin') && workspaceId && (
        <motion.section variants={item} className="space-y-8 border-t border-border/50 pt-12">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-foreground text-background">
                <Activity className="w-5 h-5" />
            </div>
            <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter">Global Operation Log</h2>
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.3em] mt-1">Real-time workspace activity stream</p>
            </div>
          </div>
          
          <div className="border border-border/50 bg-muted/5 p-8 max-h-[600px] overflow-y-auto custom-scrollbar">
            <ActivityTimeline workspaceId={workspaceId} />
          </div>
        </motion.section>
      )}
    </motion.div>
  );
}
