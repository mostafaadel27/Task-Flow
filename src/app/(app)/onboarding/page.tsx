"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Layers, Plus, Mail, ArrowRight, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import { useInvitations } from "@/hooks/useInvitations";
import { useActivityLogs } from "@/hooks/useActivityLogs";

type Step = "choose" | "create" | "join";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<Step>("choose");
  const [loading, setLoading] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; msg: string } | null>(null);

  const { myInvitations, myInvitationsLoading, acceptInvitation, rejectInvitation } = useInvitations(null);
  const { logAction } = useActivityLogs();

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim()) return;
    setLoading(true);
    setFeedback(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create workspace
      const { data: ws, error: wsError } = await supabase
        .from("workspaces")
        .insert([{ name: workspaceName.trim(), created_by: user.id }])
        .select()
        .single();

      if (wsError) throw wsError;

      // Add creator as owner
      const { error: memError } = await supabase
        .from("workspace_members")
        .insert([{ workspace_id: ws.id, user_id: user.id, role: "owner" }]);

      if (memError) throw memError;

      // Log activity
      const name = user.user_metadata?.full_name || user.email?.split('@')[0] || "New Member";
      logAction.mutate({
        action_type: 'user_joined',
        entity_type: 'user',
        entity_id: user.id,
        message: `${name} initialized a new workspace terminal`,
        workspace_id: ws.id
      });
      
      logAction.mutate({
        action_type: 'project_created',
        entity_type: 'workspace',
        entity_id: ws.id,
        message: `System: "${ws.name}" workspace context established`,
        workspace_id: ws.id
      });

      // Update user role to indicate they've completed onboarding
      await supabase.from("users").update({ role: "owner" }).eq("id", user.id);

      router.refresh();
      router.push("/");
    } catch (err: any) {
      setFeedback({ type: "error", msg: err?.message || "Failed to create workspace" });
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    setLoading(true);
    setFeedback(null);

    try {
      await acceptInvitation.mutateAsync(invitationId);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("users").update({ role: "member" }).eq("id", user.id);
      }

      router.refresh();
      router.push("/dashboard");
    } catch (err: any) {
      setFeedback({ type: "error", msg: err?.message || "Failed to accept invitation" });
      setLoading(false);
    }
  };

  const handleRejectInvitation = async (invitationId: string) => {
    setLoading(true);
    setFeedback(null);

    try {
      await rejectInvitation.mutateAsync(invitationId);
      setFeedback({ type: "success", msg: "Invitation declined successfully" });
      setLoading(false);
    } catch (err: any) {
      setFeedback({ type: "error", msg: err?.message || "Failed to decline invitation" });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-foreground selection:text-background">
      <header className="h-20 flex items-center px-8 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Layers className="w-6 h-6" aria-hidden="true" />
          <span className="font-extrabold tracking-tight uppercase text-lg">TaskFlow</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12">
        <div className="max-w-4xl w-full">
          {/* Step: Choose */}
          {step === "choose" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="mb-16 text-center">
                <h1 className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-6">Welcome</h1>
                <h2 className="text-[clamp(2.5rem,5vw,5rem)] font-black tracking-tighter leading-none uppercase">
                  Set up your workspace
                </h2>
                <p className="text-muted-foreground mt-6 max-w-xl mx-auto font-medium">
                  Create a new workspace to start managing your team, or join an existing one if you&apos;ve been invited.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                {/* Create Workspace */}
                <motion.button
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => setStep("create")}
                  className="group relative text-left border-2 border-border p-10 hover:border-foreground transition-colors duration-300 bg-background hover:bg-muted/10 outline-none focus-visible:ring-4 ring-foreground"
                >
                  <div className="mb-8 p-4 bg-muted inline-block border border-border/50 group-hover:scale-110 transition-transform duration-500 rounded-none">
                    <Plus className="w-8 h-8 group-hover:text-amber-500 transition-colors" />
                  </div>
                  <h3 className="text-3xl font-extrabold uppercase tracking-tight mb-4">Create Workspace</h3>
                  <p className="text-muted-foreground font-medium leading-relaxed mb-12">
                    Start a new workspace and invite your team. You&apos;ll be the owner with full control over projects and members.
                  </p>
                  <div className="flex items-center text-xs font-bold uppercase tracking-widest font-mono group-hover:text-primary transition-colors mt-auto">
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
                  </div>
                </motion.button>

                {/* Join Workspace */}
                <motion.button
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => setStep("join")}
                  className="group relative text-left border-2 border-border p-10 hover:border-foreground transition-colors duration-300 bg-background hover:bg-muted/10 outline-none focus-visible:ring-4 ring-foreground"
                >
                  <div className="relative mb-8 p-4 bg-muted inline-block border border-border/50 group-hover:scale-110 transition-transform duration-500 rounded-none">
                    <Mail className="w-8 h-8 group-hover:text-blue-500 transition-colors" />
                    {myInvitations.length > 0 && (
                      <span className="absolute -top-2 -right-2 min-w-[20px] h-[20px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold font-mono px-1">
                        {myInvitations.length}
                      </span>
                    )}
                  </div>
                  <h3 className="text-3xl font-extrabold uppercase tracking-tight mb-4">Join Workspace</h3>
                  <p className="text-muted-foreground font-medium leading-relaxed mb-12">
                    Accept an invitation to join an existing workspace. You&apos;ll be able to collaborate with your team instantly.
                  </p>
                  <div className="flex items-center text-xs font-bold uppercase tracking-widest font-mono group-hover:text-primary transition-colors mt-auto">
                    {myInvitationsLoading ? (
                      <><Loader2 className="w-3 h-3 mr-2 animate-spin" /> Checking...</>
                    ) : myInvitations.length > 0 ? (
                      `${myInvitations.length} Pending`
                    ) : (
                      "Check Invitations"
                    )}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
                  </div>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step: Create Workspace */}
          {step === "create" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-lg mx-auto"
            >
              <button
                onClick={() => { setStep("choose"); setFeedback(null); }}
                className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-8 block"
              >
                ← Back
              </button>

              <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">Name Your Workspace</h2>
              <p className="text-muted-foreground font-medium mb-10">
                This is your team&apos;s home base. You can always change it later.
              </p>

              <form onSubmit={handleCreateWorkspace} className="space-y-6">
                <div>
                  <label htmlFor="workspace-name" className="text-xs font-mono tracking-widest uppercase text-muted-foreground block mb-2">
                    Workspace Name
                  </label>
                  <Input
                    id="workspace-name"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    required
                    maxLength={60}
                    placeholder="My Company"
                    className="w-full h-14 bg-background border-border/50 text-xl font-bold tracking-tight rounded-none focus-visible:ring-0 focus-visible:border-foreground"
                    autoFocus
                  />
                </div>

                {feedback && (
                  <div className={`flex items-start gap-3 p-4 text-sm font-medium border-2 ${
                    feedback.type === "error"
                      ? "border-red-500/30 bg-red-500/5 text-red-500"
                      : "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
                  }`}>
                    {feedback.type === "error" ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
                    <span>{feedback.msg}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 rounded-none font-bold uppercase tracking-wider transition-all hover:translate-y-[-2px] hover:shadow-lg"
                  disabled={loading || !workspaceName.trim()}
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating…</>
                  ) : (
                    "Create Workspace"
                  )}
                </Button>
              </form>
            </motion.div>
          )}

          {/* Step: Join Workspace */}
          {step === "join" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-lg mx-auto"
            >
              <button
                onClick={() => { setStep("choose"); setFeedback(null); }}
                className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-8 block"
              >
                ← Back
              </button>

              <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">Pending Invitations</h2>
              <p className="text-muted-foreground font-medium mb-10">
                Accept an invitation to join a team workspace.
              </p>

              {feedback && (
                <div className={`flex items-start gap-3 p-4 text-sm font-medium border-2 mb-6 ${
                  feedback.type === "error"
                    ? "border-red-500/30 bg-red-500/5 text-red-500"
                    : "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
                }`}>
                  {feedback.type === "error" ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
                  <span>{feedback.msg}</span>
                </div>
              )}

              {myInvitationsLoading ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground font-mono uppercase tracking-widest text-sm">
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" /> Checking…
                </div>
              ) : myInvitations.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-border/50">
                  <Mail className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                  <p className="text-sm font-mono uppercase tracking-widest text-muted-foreground">No Invitations</p>
                  <p className="text-xs text-muted-foreground/60 mt-2 max-w-sm mx-auto leading-relaxed">
                    Ask your team admin to send you an invitation, or create your own workspace instead.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myInvitations.map((inv) => (
                    <div key={inv.id} className="group border-2 border-border p-6 hover:border-foreground transition-colors relative overflow-hidden">
                      <div className="absolute inset-0 bg-muted/10 -translate-x-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0" />
                      <div className="relative z-10">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div>
                            <h3 className="text-xl font-extrabold uppercase tracking-tight">
                              {(inv.workspace as any)?.name || "Workspace"}
                            </h3>
                            <p className="text-xs font-mono text-muted-foreground mt-1 uppercase tracking-widest">
                              Role: <span className="text-foreground font-bold">{inv.role}</span>
                            </p>
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest">
                            {new Date(inv.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        {(inv.inviter as any)?.name && (
                          <p className="text-sm text-muted-foreground mb-6">
                            Invited by <span className="font-bold text-foreground">{(inv.inviter as any).name}</span>
                          </p>
                        )}

                        <div className="flex gap-3">
                          <Button
                            onClick={() => handleAcceptInvitation(inv.id)}
                            className="flex-1 h-10 rounded-none font-bold uppercase tracking-wider transition-all hover:scale-[1.02]"
                            disabled={loading}
                          >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Accept & Join"}
                          </Button>
                          <Button
                            variant="ghost"
                            className="h-10 rounded-none font-mono uppercase text-xs tracking-widest hover:bg-red-500/10 hover:text-red-500"
                            disabled={loading}
                            onClick={() => handleRejectInvitation(inv.id)}
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
