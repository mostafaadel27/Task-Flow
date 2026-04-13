"use client";

import { useState } from "react";
import { UserPlus, Search, Trash2, ShieldAlert, AlertCircle, CheckCircle2, Crown, Shield, User, ChevronDown, Clock, X, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RoleBadge } from "@/components/RoleBadge";
import { InviteModal } from "@/components/InviteModal";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useInvitations } from "@/hooks/useInvitations";
import { useParams } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { WorkspaceRole } from "@/types/database";
import { motion, AnimatePresence } from "framer-motion";

export default function TeamPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const { workspace, currentRole, members, membersLoading, isOwner, isOwnerOrAdmin, changeRole, removeMember } = useWorkspace(workspaceId);
  const { invitations, pendingInvitations, sendInvitation, revokeInvitation } = useInvitations(workspace?.id);

  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState<{ error?: string; success?: string }>({});
  const [roleMenuOpen, setRoleMenuOpen] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const handleInvite = (email: string, role: WorkspaceRole) => {
    setInviteFeedback({});
    sendInvitation.mutate(
      { email, role },
      {
        onSuccess: () => {
          setInviteFeedback({ success: `Invitation sent to ${email}` });
          setTimeout(() => setInviteFeedback({}), 5000);
        },
        onError: (err: any) => {
          const msg = err?.message || "Failed to send invitation";
          if (msg.includes("DUPLICATE")) {
            setInviteFeedback({ error: "An invitation is already pending for this email." });
          } else if (msg.includes("ALREADY_MEMBER")) {
            setInviteFeedback({ error: "This user is already a member of your workspace." });
          } else if (msg.includes("SELF_INVITE")) {
            setInviteFeedback({ error: "You cannot invite yourself." });
          } else {
            setInviteFeedback({ error: msg });
          }
        },
      }
    );
  };

  const handleRoleChange = (memberId: string, newRole: WorkspaceRole) => {
    changeRole.mutate({ memberId, newRole });
    setRoleMenuOpen(null);
  };

  const handleRemove = (memberId: string) => {
    removeMember.mutate(memberId);
    setConfirmRemove(null);
  };

  const filteredMembers = members.filter(m =>
    m.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  const ROLE_ICON: Record<WorkspaceRole, any> = {
    owner: Crown,
    admin: Shield,
    member: User,
  };

  if (!workspace) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center gap-4">
        <ShieldAlert className="w-12 h-12 text-muted-foreground/20" />
        <p className="text-sm font-mono uppercase tracking-widest text-muted-foreground">No Workspace</p>
        <p className="text-xs text-muted-foreground/60 max-w-sm">Create or join a workspace to manage your team.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-140px)]">
        {/* Header */}
        <div className="flex-none mb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4">Team</h1>
              <p className="text-muted-foreground font-mono text-sm tracking-widest uppercase">
                {workspace.name} · {members.length} {members.length === 1 ? "member" : "members"}
              </p>
            </div>

            {isOwnerOrAdmin && (
              <Button
                size="lg"
                className="rounded-none font-bold uppercase tracking-wider h-11 px-8 shadow-xl hover:scale-105 transition-all duration-300 w-full md:w-auto"
                onClick={() => { setInviteOpen(true); setInviteFeedback({}); }}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Invite
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
          {/* Member List */}
          <div className="flex-1 flex flex-col min-h-0 border-2 border-border bg-background">
            <div className="p-6 border-b border-border flex items-center justify-between gap-4 bg-muted/10">
              <h2 className="text-xl font-extrabold uppercase tracking-tight">
                Members
                <span className="text-xs font-mono bg-muted px-2 py-0.5 ml-3 text-muted-foreground">{members.length}</span>
              </h2>
              <div className="relative w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full h-10 pl-10 bg-background border-border/50 text-xs font-mono tracking-widest rounded-none focus-visible:ring-0 focus-visible:border-foreground"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {membersLoading ? (
                <div className="flex items-center justify-center h-full text-muted-foreground font-mono uppercase tracking-widest text-sm">
                  Loading members...
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 gap-4 border-2 border-dashed border-border/50">
                  <ShieldAlert className="w-12 h-12 text-muted-foreground/30 mb-2" />
                  <p className="text-sm font-mono uppercase tracking-widest text-muted-foreground">No Members Found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredMembers.map(member => {
                    const MemberIcon = ROLE_ICON[member.role] || User;
                    const isCurrentUser = false; // We don't track current user ID here, but RLS handles protection
                    const canManage = isOwner || (currentRole === 'admin' && member.role === 'member');

                    return (
                      <div key={member.id} className="group border border-border/50 p-5 hover:border-foreground/40 transition-all relative">
                        {/* Clipped background animation */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                          <div className="absolute inset-0 bg-muted/10 -translate-x-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0" />
                        </div>

                        <div className="relative z-10 flex items-center gap-4">
                          {/* Avatar */}
                          <div className={`w-11 h-11 flex items-center justify-center font-bold text-base uppercase shadow-sm shrink-0 ${
                            member.role === 'owner' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30' :
                            member.role === 'admin' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30' :
                            'bg-foreground text-background'
                          }`}>
                            {member.user?.name?.substring(0, 2) || "??"}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h3 className="text-sm font-extrabold uppercase tracking-tight truncate">
                                {member.user?.name || "Unknown"}
                              </h3>
                              <RoleBadge role={member.role} size="xs" />
                            </div>
                            <p className="text-xs font-mono text-muted-foreground truncate">
                              {member.user?.email || "—"}
                            </p>
                          </div>

                          {/* Actions */}
                          {canManage && member.role !== 'owner' && (
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              {/* Role changer (owner only) */}
                              {isOwner && (
                                <div className="relative">
                                  <button
                                    onClick={() => setRoleMenuOpen(roleMenuOpen === member.id ? null : member.id)}
                                    className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest border border-border bg-background hover:border-foreground/50 transition-colors rounded-none"
                                  >
                                    <MemberIcon className="w-3 h-3" />
                                    Role
                                    <ChevronDown className="w-3 h-3" />
                                  </button>

                                  {roleMenuOpen === member.id && (
                                    <div className="absolute right-0 top-full mt-1 bg-background border-2 border-border shadow-2xl z-50 min-w-[160px]">
                                      {(['admin', 'member'] as WorkspaceRole[]).map(r => (
                                        <button
                                          key={r}
                                          onClick={() => handleRoleChange(member.id, r)}
                                          className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors hover:bg-muted/30 ${
                                            member.role === r ? 'text-foreground bg-muted/20' : 'text-muted-foreground'
                                          }`}
                                        >
                                          {r === member.role ? `✓ ${r}` : r}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Remove */}
                              <button
                                onClick={() => setConfirmRemove(member.id)}
                                className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all rounded-none"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Invitations Panel (Owner/Admin only) */}
          {isOwnerOrAdmin && (
            <div className="w-full lg:w-[340px] flex-none">
              <div className="border-2 border-border bg-background h-full flex flex-col">
                <div className="p-6 border-b border-border bg-muted/10">
                  <h2 className="text-lg font-extrabold uppercase tracking-tight flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Invitations
                    {pendingInvitations.length > 0 && (
                      <span className="text-xs font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2 py-0.5">
                        {pendingInvitations.length}
                      </span>
                    )}
                  </h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {pendingInvitations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4 gap-3">
                      <Mail className="w-8 h-8 text-muted-foreground/20" />
                      <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">No Pending</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingInvitations.map(inv => (
                        <div key={inv.id} className="border border-border/50 p-4 group hover:border-foreground/30 transition-colors">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0">
                              <p className="text-xs font-bold uppercase tracking-tight truncate">{inv.email}</p>
                              <RoleBadge role={inv.role} size="xs" />
                            </div>
                            <button
                              onClick={() => revokeInvitation.mutate(inv.id)}
                              className="p-1 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                              title="Revoke invitation"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest">
                            <Clock className="w-3 h-3" />
                            Expires {new Date(inv.expires_at).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={handleInvite}
        isPending={sendInvitation.isPending}
        error={inviteFeedback.error}
        success={inviteFeedback.success}
      />

      {/* Remove Confirmation Dialog */}
      {confirmRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setConfirmRemove(null)}>
          <div className="bg-background border-2 border-border p-8 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-extrabold uppercase tracking-tight text-red-500 mb-4">Remove Member</h2>
            <p className="text-sm text-muted-foreground mb-8">
              This member will lose access to the workspace and all associated projects. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" className="font-mono uppercase text-xs tracking-widest rounded-none" onClick={() => setConfirmRemove(null)}>
                Cancel
              </Button>
              <Button variant="destructive" className="font-bold uppercase tracking-wider rounded-none" onClick={() => handleRemove(confirmRemove)}>
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
