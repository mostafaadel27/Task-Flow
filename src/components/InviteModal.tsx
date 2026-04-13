"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkspaceRole } from "@/types/database";
import { motion, AnimatePresence } from "framer-motion";

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
  onInvite: (email: string, role: WorkspaceRole) => void;
  isPending: boolean;
  error?: string | null;
  success?: string | null;
}

export function InviteModal({ open, onClose, onInvite, isPending, error, success }: InviteModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("member");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handler = () => onClose();
    dialog.addEventListener("close", handler);
    return () => dialog.removeEventListener("close", handler);
  }, [onClose]);

  // Reset on success
  useEffect(() => {
    if (success) {
      setEmail("");
      setRole("member");
    }
  }, [success]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    onInvite(email.trim(), role);
  };

  const roles: { value: WorkspaceRole; label: string; desc: string; color: string }[] = [
    { value: "member", label: "Member", desc: "Can view and work on assigned tasks", color: "border-border/50 bg-background" },
    { value: "admin", label: "Admin", desc: "Can manage projects, tasks, and invite users", color: "border-blue-500/30 bg-blue-500/5" },
  ];

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 m-auto bg-background text-foreground w-full max-w-lg border border-border rounded-none shadow-2xl backdrop:bg-background/80 backdrop:backdrop-blur p-0 overflow-hidden"
      onClick={(e) => { if (e.target === dialogRef.current) onClose(); }}
    >
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-extrabold uppercase tracking-tight">Invite Member</h2>
            <p className="text-xs font-mono text-muted-foreground mt-1 uppercase tracking-widest">Send a workspace invitation</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground border border-transparent hover:border-border transition-colors rounded-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label htmlFor="invite-email" className="text-xs font-mono tracking-widest uppercase text-muted-foreground block mb-2">
              Email Address
            </label>
            <Input
              ref={inputRef}
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="colleague@company.com"
              className="w-full h-12 bg-background border-border/50 text-sm font-mono uppercase tracking-widest rounded-none focus-visible:ring-0 focus-visible:border-foreground"
            />
          </div>

          {/* Role Selection */}
          <fieldset>
            <legend className="text-xs font-mono tracking-widest uppercase text-muted-foreground mb-3">
              Assign Role
            </legend>
            <div className="grid grid-cols-2 gap-3">
              {roles.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`text-left p-4 border-2 transition-all rounded-none ${
                    role === r.value
                      ? `${r.color} border-foreground shadow-lg scale-[1.02]`
                      : 'border-border/50 bg-background hover:border-foreground/30 hover:bg-muted/10'
                  }`}
                >
                  <span className="text-sm font-extrabold uppercase tracking-tight block">{r.label}</span>
                  <span className="text-[10px] text-muted-foreground font-mono mt-1 block leading-relaxed">{r.desc}</span>
                </button>
              ))}
            </div>
          </fieldset>

          {/* Feedback */}
          <AnimatePresence mode="wait">
            {(error || success) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className={`flex items-start gap-3 p-4 text-sm font-medium border-2 ${
                  error
                    ? "border-red-500/30 bg-red-500/5 text-red-500"
                    : "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {error
                  ? <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  : <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                }
                <span className="leading-relaxed">{error || success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex gap-4 justify-end pt-2">
            <Button
              type="button"
              variant="ghost"
              className="font-mono uppercase text-xs tracking-widest rounded-none"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="font-bold uppercase tracking-wider h-11 px-8 rounded-none transition-transform hover:scale-105"
              disabled={!email.trim() || isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Invite
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
