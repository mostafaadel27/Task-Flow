"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Plus, Loader2, ArrowRight, AlertCircle, Trash2, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProjects } from "@/hooks/useProjects";
import { useWorkspace } from "@/hooks/useWorkspace";
import { motion, AnimatePresence } from "framer-motion";

export default function ProjectsPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  
  const { projects, isLoading, error, refetch, createProject, deleteProject } = useProjects(workspaceId);
  const { isOwnerOrAdmin, currentRole, isLoading: workspaceLoading } = useWorkspace(workspaceId);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  
  // Security: Block members from this page
  useEffect(() => {
    if (!workspaceLoading && currentRole === 'member') {
      router.replace(`/ws/${workspaceId}/workspace`);
    }
  }, [currentRole, workspaceLoading, router, workspaceId]);

  const openDeleteDialog = useCallback((project: { id: string; title: string }) => {
    setDeleteTarget(project);
    deleteDialogRef.current?.showModal();
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleteTarget(null);
    deleteDialogRef.current?.close();
  }, []);

  useEffect(() => {
    const dialog = deleteDialogRef.current;
    if (!dialog) return;
    const handleClose = () => setDeleteTarget(null);
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, []);

  const handleCreateNew = () => {
    createProject.mutate("UNTITLED WORKSTREAM", {
      onSuccess: (data) => {
        if (data?.id) router.push(`/ws/${workspaceId}/board/${data.id}`);
      },
      onError: (err) => {
        console.error("Create project failed:", err);
      }
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteProject.mutate(deleteTarget.id, {
      onSuccess: () => closeDeleteDialog(),
    });
  };

  const container: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const item: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { ease: [0.16, 1, 0.3, 1] as [number, number, number, number], duration: 0.5 } }
  };

  if (workspaceLoading || (currentRole === 'member')) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-32 gap-6">
        <Loader2 className="w-8 h-8 animate-[spin_3s_linear_infinite] text-muted-foreground/30" />
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Authenticating Sector Access…</span>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-12">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/50 pb-8"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter uppercase leading-none">Projects</h1>
            <span className="block text-sm font-mono text-muted-foreground uppercase tracking-widest mt-4">All your workstreams</span>
          </div>
          {isOwnerOrAdmin && (
            <Button onClick={handleCreateNew} disabled={createProject.isPending} size="lg" className="gap-2 font-bold uppercase tracking-wider text-xs px-6 transition-all shadow-xl hover:scale-105">
              {createProject.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {createProject.isPending ? "INITIALIZING..." : "New Project"}
            </Button>
          )}
        </motion.div>

        {/* Mutation Error */}
        {createProject.isError && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-500/10 border-l-4 border-red-500 p-4 mb-8">
            <p className="text-xs font-mono uppercase tracking-widest text-red-500 font-bold">
              System Error: {(createProject.error as Error)?.message || "Failed to create project"}
            </p>
          </motion.div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-32 gap-6" role="status">
            <Loader2 className="w-8 h-8 animate-[spin_3s_linear_infinite] text-muted-foreground/30" />
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Loading workspace…</span>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="py-24 text-center border-2 border-dashed border-red-500/20 bg-red-500/5 rounded-xl" role="alert">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
            <p className="text-sm font-mono uppercase tracking-widest text-red-500/80">Failed to load projects: {(error as Error)?.message || "Unknown error"}</p>
            <button onClick={() => refetch()} className="text-sm font-bold uppercase tracking-widest mt-6 hover:text-red-500 transition-colors">
              Try again
            </button>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && projects?.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-32 text-center border-2 border-dashed border-border/50 rounded-xl bg-muted/10"
          >
            <FolderKanban className="w-12 h-12 text-muted-foreground/20 mx-auto mb-6" />
            <p className="text-lg font-bold uppercase tracking-widest text-muted-foreground">Zero Projects</p>
            {isOwnerOrAdmin ? (
              <button onClick={handleCreateNew} disabled={createProject.isPending} className="text-sm font-mono uppercase tracking-widest mt-4 hover:text-foreground transition-colors underline underline-offset-4 decoration-muted-foreground/30 hover:decoration-foreground">
                {createProject.isPending ? "INITIALIZING..." : "Create your first project →"}
              </button>
            ) : (
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mt-4">Ask an operations manager to initialize a workstream.</p>
            )}
          </motion.div>
        )}

        {/* Project list */}
        {!isLoading && !error && projects && projects.length > 0 && (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid lg:grid-cols-2 gap-4"
          >
            {projects.map((project: any, i: number) => {
              const pTasks = project.tasks || [];
              const pCompleted = pTasks.filter((t: any) => t.status === 'done').length;
              const progress = pTasks.length === 0 ? 0 : Math.round((pCompleted / pTasks.length) * 100);

              return (
                <motion.div variants={item} key={project.id}>
                  <Link href={`/ws/${workspaceId}/board/${project.id}`} className="block group">
                    <div className="p-8 border border-border/50 bg-background rounded-xl flex flex-col justify-between min-h-[220px] hover:border-foreground/20 hover:shadow-lg transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 relative overflow-hidden">
                      {/* Sub-bg decoration */}
                      <div className="absolute top-0 right-0 -mr-8 -mt-8 font-mono text-[120px] font-black text-muted/20 select-none group-hover:text-muted/40 transition-colors duration-500 pointer-events-none">
                        0{i + 1}
                      </div>

                      <div className="relative z-10 flex items-start justify-between">
                        <h2 className="text-3xl font-extrabold uppercase tracking-tight group-hover:text-primary transition-colors max-w-[80%] break-words leading-none">
                          {project.title}
                        </h2>
                        {isOwnerOrAdmin && (
                          <button
                            onClick={(e) => {
                                e.preventDefault();
                                openDeleteDialog({ id: project.id, title: project.title });
                            }}
                            className="p-2 rounded bg-background/80 backdrop-blur text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-500/10 transition-all shrink-0 z-20"
                            aria-label={`Delete ${project.title}`}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>

                      <div className="relative z-10 mt-12 flex flex-col gap-4">
                        <div className="flex items-center justify-between font-mono text-xs uppercase tracking-widest text-muted-foreground">
                          <span>{pCompleted} / {pTasks.length} Tasks</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-foreground h-full transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] delay-100" 
                            style={{ width: `${progress}%` }}
                            role="progressbar"
                            aria-valuenow={progress}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          />
                        </div>
                        <div className="font-mono text-[10px] text-muted-foreground/60 tracking-widest uppercase mt-2 flex items-center gap-2">
                          Created {new Date(project.created_at).toLocaleDateString()}
                          <span className="opacity-30">|</span>
                          BY {project.user?.name || project.user?.email || "Unknown"}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>



      {/* Delete confirmation dialog */}
      <dialog
        ref={deleteDialogRef}
        className="fixed inset-0 m-auto bg-background text-foreground w-full max-w-sm border border-border shadow-2xl backdrop:bg-background/80 backdrop:backdrop-blur-sm p-8"
        onClick={(e) => { if (e.target === deleteDialogRef.current) closeDeleteDialog(); }}
      >
        <div className="">
          <h2 className="text-2xl font-extrabold uppercase tracking-tight text-red-500">Delete Project</h2>
          <p className="text-sm font-medium mt-4 leading-relaxed">
            Delete <span className="font-mono bg-muted px-1.5 py-0.5">{deleteTarget?.title}</span> and all its tasks? This action cannot be undone.
          </p>
          
          <div className="flex gap-4 justify-end mt-10">
            <Button type="button" variant="ghost" onClick={closeDeleteDialog} className="font-mono uppercase text-xs tracking-widest">Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleteProject.isPending}
              className="font-bold uppercase tracking-wider h-11 px-6 rounded-none"
            >
              {deleteProject.isPending ? "Deleting…" : "Confirm"}
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}

