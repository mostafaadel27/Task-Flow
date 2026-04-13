"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Check, CheckCheck, Users, ClipboardList, Mail, UserPlus, Loader2, Trash2, X } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { useInvitations } from "@/hooks/useInvitations";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams } from "next/navigation";

const ICON_MAP: Record<string, any> = {
  team_invite: Users,
  task_assigned: ClipboardList,
  workspace_invite: Mail,
  user_joined: UserPlus,
  task_updated: ClipboardList,
  task_completed: Check,
};

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllRead, deleteNotification } = useNotifications();
  const { acceptInvitation, rejectInvitation } = useInvitations(null);
  const router = useRouter();
  const params = useParams();
  const currentWorkspaceId = params?.workspaceId as string;
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [processingInvite, setProcessingInvite] = useState<string | null>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleAcceptInvite = async (notificationId: string, invitationId: string) => {
    setProcessingInvite(invitationId);
    try {
      // 1. Mark as read immediately in DB to clear UI
      await markAsRead.mutateAsync(notificationId);
      
      // 2. Perform acceptance logic
      await acceptInvitation.mutateAsync(invitationId);
    } catch (err) {
      console.error("Failed to accept invitation:", err);
    }
    setProcessingInvite(null);
  };

  const handleRejectInvite = async (notificationId: string, invitationId: string) => {
    setProcessingInvite(invitationId);
    try {
      // 1. Mark as read immediately
      await markAsRead.mutateAsync(notificationId);
      
      // 2. Perform rejection
      await rejectInvitation.mutateAsync(invitationId);
    } catch (err) {
      console.error("Failed to reject invitation:", err);
    }
    setProcessingInvite(null);
  };

  const handleNotificationClick = (n: any) => {
    if (!n.read) {
      markAsRead.mutate(n.id);
    }
    
    if (n.metadata?.project_id) {
      setOpen(false);
      const wsId = n.metadata.workspace_id || currentWorkspaceId;
      
      if (wsId) {
        router.push(`/ws/${wsId}/board/${n.metadata.project_id}`);
      } else {
        router.push(`/dashboard`);
      }
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteNotification.mutate(id);
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-none border border-transparent hover:border-border hover:bg-muted/30"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold font-mono px-1 animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scaleY: 0.9, originY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0.9 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 top-full mt-2 w-[400px] bg-background border-2 border-border shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/10">
              <h3 className="text-sm font-extrabold uppercase tracking-tight">Notifications</h3>
              <div className="flex gap-4">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllRead.mutate()}
                    className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    <CheckCheck className="w-3 h-3" /> Mark Read
                  </button>
                )}
                <button
                  onClick={() => {
                    notifications?.forEach(n => deleteNotification.mutate(n.id));
                  }}
                  className="text-[10px] font-mono uppercase tracking-widest text-red-500/70 hover:text-red-500 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Purge
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-[450px] overflow-y-auto">
              {!notifications || notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">No Records Found</p>
                </div>
              ) : (
                notifications.map(n => {
                  const Icon = ICON_MAP[n.type] || Bell;
                  const isInvite = n.type === 'workspace_invite' && !n.read;
                  const invitationId = n.metadata?.invitation_id;

                  return (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 p-4 border-b border-border/50 group/item relative transition-colors ${
                        !n.read ? 'bg-primary/5' : 'hover:bg-muted/10'
                      } ${!isInvite ? 'cursor-pointer' : ''}`}
                      onClick={() => { if (!isInvite) handleNotificationClick(n); }}
                    >
                      <div className={`p-2 border shrink-0 ${
                        !n.read
                          ? n.type === 'workspace_invite' ? 'bg-blue-500 text-white border-blue-500' : 'bg-foreground text-background border-foreground'
                          : 'bg-muted/30 text-muted-foreground border-border/50'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold uppercase tracking-tight">{n.title}</span>
                            {!n.read && <span className="w-1.5 h-1.5 bg-red-500 shrink-0" />}
                          </div>
                          <button 
                            onClick={(e) => handleDelete(e, n.id)}
                            className="p-1 opacity-0 group-hover/item:opacity-100 hover:text-red-500 transition-all"
                          >
                             <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{n.message}</p>

                        {/* Invitation Actions */}
                        {isInvite && invitationId && (
                          <div className="flex items-center gap-2 mt-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleAcceptInvite(n.id, invitationId); }}
                              disabled={processingInvite === invitationId}
                              className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-foreground text-background hover:opacity-90 transition-opacity border border-foreground disabled:opacity-50"
                            >
                              {processingInvite === invitationId ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                              Accept
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRejectInvite(n.id, invitationId); }}
                              disabled={processingInvite === invitationId}
                              className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-red-500 border border-border hover:border-red-500/30 transition-colors disabled:opacity-50"
                            >
                              Decline
                            </button>
                          </div>
                        )}

                        <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest mt-2 block">
                          {new Date(n.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
