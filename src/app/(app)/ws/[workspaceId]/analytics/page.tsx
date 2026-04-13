"use client";

import { useWorkspace } from "@/hooks/useWorkspace";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { Loader2, ShieldAlert, Activity, GitCommit, FileStack, Users } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";

export default function AnalyticsPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const { workspace, currentRole, isLoading, members } = useWorkspace(workspaceId);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && currentRole === 'member') {
      router.push('/dashboard');
    }
  }, [isLoading, currentRole, router]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-32 gap-6">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground/30" />
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Synchronizing Tactical Data…</span>
      </div>
    );
  }

  if (currentRole === 'member') return null;

  const container: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { ease: [0.16, 1, 0.3, 1], duration: 0.8 } }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="flex-1 space-y-12 pb-12 p-8"
    >
      {/* Header */}
      <motion.div variants={item} className="flex flex-col gap-2 border-b border-border/50 pb-8">
          <div className="flex items-center gap-4">
              <div className="p-3 bg-foreground text-background">
                  <Activity className="w-6 h-6" />
              </div>
              <div>
                  <h1 className="text-5xl font-black uppercase tracking-tighter leading-none">Operational Intelligence</h1>
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-[0.4em] mt-2">Workspace Audit Trail & Tactical Logs</p>
              </div>
          </div>
      </motion.div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div variants={item} className="p-8 border border-border/50 bg-muted/5 flex items-center justify-between group hover:bg-muted/10 transition-all">
              <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-4">Network Nodes</p>
                  <p className="text-5xl font-black tracking-tighter leading-none">{members?.length || 0}</p>
              </div>
              <Users className="w-10 h-10 text-muted-foreground/20 group-hover:text-primary transition-colors" />
          </motion.div>

          <motion.div variants={item} className="p-8 border border-border/50 bg-muted/5 flex items-center justify-between group hover:bg-muted/10 transition-all">
              <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-4">Active Projects</p>
                  <p className="text-5xl font-black tracking-tighter leading-none">SYNCED</p>
              </div>
              <FileStack className="w-10 h-10 text-muted-foreground/20 group-hover:text-primary transition-colors" />
          </motion.div>

          <motion.div variants={item} className="p-8 border border-border/50 bg-muted/20 flex items-center justify-between group">
              <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-4">Current Sector</p>
                  <p className="text-5xl font-black tracking-tighter leading-none uppercase truncate max-w-[240px]">{workspace?.name || 'GLOBAL'}</p>
              </div>
              <GitCommit className="w-10 h-10 text-muted-foreground/20" />
          </motion.div>
      </div>

      {/* Main Activity Log */}
      <motion.section variants={item} className="space-y-10">
          <div className="flex items-center gap-4">
              <div className="w-2 h-2 bg-primary animate-pulse" />
              <h2 className="text-xl font-bold uppercase tracking-tight">Deployment History</h2>
              <div className="h-[1px] flex-1 bg-border/20" />
          </div>

          <div className="border border-border/50 bg-muted/5 p-10 shadow-[20px_20px_0px_rgba(0,0,0,0.05)]">
            {workspace?.id && (
                <ActivityTimeline workspaceId={workspace.id} />
            )}
          </div>
      </motion.section>

      {/* Security Footer */}
      <motion.div variants={item} className="p-6 border border-dashed border-border/50 flex items-center gap-4 opacity-50">
          <ShieldAlert className="w-5 h-5 text-muted-foreground" />
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] leading-relaxed">
              Tactical Log encryption level: LEVEL-7. All entries are cryptographically signed 
              and archived for compliance. Access limited to Administrative Personnel. 
          </p>
      </motion.div>
    </motion.div>
  );
}
