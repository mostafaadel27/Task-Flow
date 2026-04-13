"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/UserAvatar";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useParams } from "next/navigation";
import { useWorkspace } from "@/hooks/useWorkspace";
import { RoleBadge } from "@/components/RoleBadge";
import { Users, Shield } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const supabase = createClient();
  const { workspace, currentRole, isOwnerOrAdmin } = useWorkspace(workspaceId);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Load user data once
  if (!loaded) {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setName(user.user_metadata?.full_name || user.email?.split('@')[0] || "");
        setEmail(user.email || "");
        setAvatarUrl(user.user_metadata?.avatar_url);
      }
      setLoaded(true);
    });
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);

    const { error } = await supabase.auth.updateUser({
      data: { full_name: name.trim() }
    });

    setSaving(false);
    if (error) {
      setSaveMsg({ type: 'error', text: 'Failed to save. Please try again.' });
    } else {
      setSaveMsg({ type: 'success', text: 'Profile updated.' });
      router.refresh();
    }
  };

  if (!loaded) {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-24 bg-muted rounded" />
          <div className="h-14 w-14 bg-muted rounded-full" />
          <div className="h-10 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-10">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

        {/* Profile */}
        <form onSubmit={handleSave}>
          <section aria-labelledby="profile-heading" className="space-y-6">
            <h2 id="profile-heading" className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Profile</h2>
            
            <div className="flex items-center gap-4">
              <UserAvatar url={avatarUrl} name={name} className="w-14 h-14 text-lg" />
              <div className="min-w-0">
                <p className="font-medium truncate">{name}</p>
                <p className="text-sm text-muted-foreground truncate">{email}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="settings-name" className="text-sm font-medium">Name</label>
                <Input 
                  id="settings-name" 
                  value={name}
                  onChange={(e) => { setName(e.target.value); setSaveMsg(null); }}
                  maxLength={100} 
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="settings-email" className="text-sm font-medium">Email</label>
                <Input 
                  id="settings-email" 
                  value={email} 
                  type="email" 
                  disabled 
                  className="opacity-60" 
                  aria-describedby="email-hint"
                />
                <p id="email-hint" className="text-xs text-muted-foreground">Managed by your OAuth provider</p>
              </div>
            </div>

            {saveMsg && (
              <p className={`text-sm ${saveMsg.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} role={saveMsg.type === 'error' ? 'alert' : 'status'}>
                {saveMsg.text}
              </p>
            )}
            
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </section>
        </form>

        <hr className="border-border" />

        {/* Workspace */}
        <section aria-labelledby="workspace-heading" className="space-y-6">
          <h2 id="workspace-heading" className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Workspace</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium">Current Workspace</p>
                <p className="text-xs text-muted-foreground mt-0.5">Your active team workspace</p>
              </div>
              <span className="text-xs font-mono font-bold text-foreground border border-border px-2 py-1">
                {workspace?.name || "Initializing…"}
              </span>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium">Your Role</p>
                <p className="text-xs text-muted-foreground mt-0.5">Permissions are based on your workspace role</p>
              </div>
              {currentRole ? (
                <RoleBadge role={currentRole as any} size="sm" />
              ) : (
                <span className="text-xs font-mono text-muted-foreground border border-border px-2 py-1">—</span>
              )}
            </div>

            {isOwnerOrAdmin && (
              <div className="pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="font-mono text-xs uppercase tracking-widest rounded-none h-9"
                  onClick={() => router.push('/team')}
                >
                  Manage Team members
                </Button>
              </div>
            )}
          </div>
        </section>

        <hr className="border-border" />

        {/* Preferences */}
        <section aria-labelledby="prefs-heading" className="space-y-6">
          <h2 id="prefs-heading" className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Preferences</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium">Theme</p>
                <p className="text-xs text-muted-foreground mt-0.5">Follows your system preference</p>
              </div>
              <span className="text-xs text-muted-foreground border border-border px-2 py-1 rounded">System</span>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium">Email notifications</p>
                <p className="text-xs text-muted-foreground mt-0.5">Daily summaries and task reminders</p>
              </div>
              <span className="text-xs text-muted-foreground border border-border px-2 py-1 rounded">On</span>
            </div>
          </div>
        </section>

        <hr className="border-border" />

        {/* Danger */}
        <section aria-labelledby="danger-heading" className="space-y-4">
          <h2 id="danger-heading" className="text-sm font-medium text-red-500 uppercase tracking-wider">Danger zone</h2>
          <p className="text-sm text-muted-foreground">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>Delete account</Button>
        </section>
      </div>

      {/* Delete confirmation */}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeleteOpen(false)}>
          <div className="bg-card border border-border rounded-lg p-6 max-w-sm w-full mx-4 shadow-lg" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold">Delete account?</h2>
            <p className="text-sm text-muted-foreground mt-2">
              This will permanently delete your account, all projects, and all tasks. This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end mt-6">
              <Button variant="ghost" onClick={() => setDeleteOpen(false)}>Cancel</Button>
              <Button variant="destructive" disabled>
                Contact support
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
