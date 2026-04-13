-- ============================================================
-- TaskFlow v2: Team Collaboration Schema Migration
-- Run this in your Supabase SQL Editor AFTER the original schema.sql
-- ============================================================

-- 1. Create new ENUM types
DO $$ BEGIN
  CREATE TYPE workspace_role AS ENUM ('owner', 'admin', 'member');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Workspaces Table
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- Users can see workspaces they are a member of
CREATE POLICY "Users can view their workspaces" ON public.workspaces
  FOR SELECT USING (
    id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
  );

-- Only authenticated users can create workspaces
CREATE POLICY "Authenticated users can create workspaces" ON public.workspaces
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Only owner can update workspace
CREATE POLICY "Workspace owners can update" ON public.workspaces
  FOR UPDATE USING (
    id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role = 'owner')
  );

-- Only owner can delete workspace
CREATE POLICY "Workspace owners can delete" ON public.workspaces
  FOR DELETE USING (
    id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role = 'owner')
  );

-- 3. Workspace Members Table (replaces team_members)
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role workspace_role DEFAULT 'member' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(workspace_id, user_id)
);

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Members can view other members in their workspace
CREATE POLICY "Members can view workspace members" ON public.workspace_members
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM public.workspace_members wm WHERE wm.user_id = auth.uid())
  );

-- Only owner/admin can add members
CREATE POLICY "Owner/Admin can add members" ON public.workspace_members
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members wm
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin')
    )
    OR NOT EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = workspace_id)
  );

-- Only owner/admin can update members (role changes)
CREATE POLICY "Owner/Admin can update members" ON public.workspace_members
  FOR UPDATE USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members wm
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin')
    )
  );

-- Only owner/admin can remove members
CREATE POLICY "Owner/Admin can remove members" ON public.workspace_members
  FOR DELETE USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members wm
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin')
    )
    OR user_id = auth.uid()
  );

-- 4. Invitations Table
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role workspace_role DEFAULT 'member' NOT NULL,
  status invitation_status DEFAULT 'pending' NOT NULL,
  invited_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (timezone('utc'::text, now()) + interval '72 hours'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(workspace_id, email, status)
);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Owner/Admin can view invitations for their workspace
CREATE POLICY "Owner/Admin can view invitations" ON public.invitations
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members wm
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin')
    )
    OR email IN (SELECT email FROM public.users WHERE id = auth.uid())
  );

-- Owner/Admin can create invitations
CREATE POLICY "Owner/Admin can create invitations" ON public.invitations
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members wm
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin')
    )
  );

-- Invited user or Owner/Admin can update invitation status
CREATE POLICY "Can update own invitation or admin" ON public.invitations
  FOR UPDATE USING (
    email IN (SELECT email FROM public.users WHERE id = auth.uid())
    OR workspace_id IN (
      SELECT workspace_id FROM public.workspace_members wm
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin')
    )
  );

-- Owner/Admin can delete invitations
CREATE POLICY "Owner/Admin can delete invitations" ON public.invitations
  FOR DELETE USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members wm
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin')
    )
  );

-- 5. Add workspace_id to projects
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'workspace_id') THEN
    ALTER TABLE public.projects ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 6. Add assigned_to to tasks
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'assigned_to') THEN
    ALTER TABLE public.tasks ADD COLUMN assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 7. Update projects RLS for workspace-based access
DROP POLICY IF EXISTS "Users can fully manage their own projects" ON public.projects;

CREATE POLICY "Workspace members can view projects" ON public.projects
  FOR SELECT USING (
    user_id = auth.uid()
    OR workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owner/Admin can create projects" ON public.projects
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

CREATE POLICY "Owner/Admin can update projects" ON public.projects
  FOR UPDATE USING (
    user_id = auth.uid()
    OR workspace_id IN (
      SELECT workspace_id FROM public.workspace_members wm
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owner/Admin can delete projects" ON public.projects
  FOR DELETE USING (
    user_id = auth.uid()
    OR workspace_id IN (
      SELECT workspace_id FROM public.workspace_members wm
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin')
    )
  );

-- 8. Update tasks RLS for workspace-based access
DROP POLICY IF EXISTS "Users can fully manage their own tasks" ON public.tasks;

CREATE POLICY "Workspace members can view tasks" ON public.tasks
  FOR SELECT USING (
    user_id = auth.uid()
    OR assigned_to = auth.uid()
    OR project_id IN (
      SELECT p.id FROM public.projects p
      WHERE p.workspace_id IN (
        SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Members can create tasks" ON public.tasks
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR project_id IN (
      SELECT p.id FROM public.projects p
      WHERE p.workspace_id IN (
        SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Task owners and admins can update" ON public.tasks
  FOR UPDATE USING (
    user_id = auth.uid()
    OR assigned_to = auth.uid()
    OR project_id IN (
      SELECT p.id FROM public.projects p
      WHERE p.workspace_id IN (
        SELECT workspace_id FROM public.workspace_members wm
        WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin')
      )
    )
  );

CREATE POLICY "Task owners and admins can delete" ON public.tasks
  FOR DELETE USING (
    user_id = auth.uid()
    OR project_id IN (
      SELECT p.id FROM public.projects p
      WHERE p.workspace_id IN (
        SELECT workspace_id FROM public.workspace_members wm
        WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin')
      )
    )
  );

-- 9. Update Notifications RLS — users can insert notifications for others
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Workspace members can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

-- 10. Function: Accept invitation (atomic: update invitation + add workspace member)
CREATE OR REPLACE FUNCTION public.accept_invitation(invitation_id UUID)
RETURNS VOID AS $$
DECLARE
  inv RECORD;
  current_user_id UUID;
  current_user_email TEXT;
BEGIN
  current_user_id := auth.uid();
  SELECT email INTO current_user_email FROM public.users WHERE id = current_user_id;
  
  -- Get and lock the invitation
  SELECT * INTO inv FROM public.invitations
  WHERE id = invitation_id AND status = 'pending' AND expires_at > now()
  FOR UPDATE;
  
  IF inv IS NULL THEN
    RAISE EXCEPTION 'Invitation not found, expired, or already used';
  END IF;
  
  IF inv.email != current_user_email THEN
    RAISE EXCEPTION 'This invitation is not for your email address';
  END IF;
  
  -- Update invitation status
  UPDATE public.invitations SET status = 'accepted' WHERE id = invitation_id;
  
  -- Add user to workspace (ignore if already exists)
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (inv.workspace_id, current_user_id, inv.role)
  ON CONFLICT (workspace_id, user_id) DO NOTHING;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Function: Reject invitation
CREATE OR REPLACE FUNCTION public.reject_invitation(invitation_id UUID)
RETURNS VOID AS $$
DECLARE
  inv RECORD;
  current_user_email TEXT;
BEGIN
  SELECT email INTO current_user_email FROM public.users WHERE id = auth.uid();
  
  SELECT * INTO inv FROM public.invitations
  WHERE id = invitation_id AND status = 'pending'
  FOR UPDATE;
  
  IF inv IS NULL THEN
    RAISE EXCEPTION 'Invitation not found or already processed';
  END IF;
  
  IF inv.email != current_user_email THEN
    RAISE EXCEPTION 'This invitation is not for your email address';
  END IF;
  
  UPDATE public.invitations SET status = 'rejected' WHERE id = invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Function: Auto-expire old invitations (can be called by cron or on-demand)
CREATE OR REPLACE FUNCTION public.expire_old_invitations()
RETURNS VOID AS $$
BEGIN
  UPDATE public.invitations
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Function: Get workspace stats for team dashboard
CREATE OR REPLACE FUNCTION public.get_workspace_stats(ws_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Verify the caller is a member
  IF NOT EXISTS (
    SELECT 1 FROM public.workspace_members WHERE workspace_id = ws_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not a member of this workspace';
  END IF;
  
  SELECT json_build_object(
    'total_members', (SELECT COUNT(*) FROM public.workspace_members WHERE workspace_id = ws_id),
    'total_projects', (SELECT COUNT(*) FROM public.projects WHERE workspace_id = ws_id),
    'total_tasks', (
      SELECT COUNT(*) FROM public.tasks t
      JOIN public.projects p ON t.project_id = p.id
      WHERE p.workspace_id = ws_id
    ),
    'completed_tasks', (
      SELECT COUNT(*) FROM public.tasks t
      JOIN public.projects p ON t.project_id = p.id
      WHERE p.workspace_id = ws_id AND t.status = 'done'
    ),
    'pending_tasks', (
      SELECT COUNT(*) FROM public.tasks t
      JOIN public.projects p ON t.project_id = p.id
      WHERE p.workspace_id = ws_id AND t.status != 'done'
    ),
    'overdue_tasks', (
      SELECT COUNT(*) FROM public.tasks t
      JOIN public.projects p ON t.project_id = p.id
      WHERE p.workspace_id = ws_id AND t.status != 'done' AND t.due_date < now()
    ),
    'tasks_per_user', (
      SELECT json_agg(row_to_json(sub))
      FROM (
        SELECT u.name, u.email,
          COUNT(t.id) FILTER (WHERE t.status != 'done') AS active_tasks,
          COUNT(t.id) FILTER (WHERE t.status = 'done') AS completed_tasks,
          COUNT(t.id) AS total_tasks
        FROM public.workspace_members wm
        JOIN public.users u ON wm.user_id = u.id
        LEFT JOIN public.tasks t ON t.assigned_to = wm.user_id
          AND t.project_id IN (SELECT id FROM public.projects WHERE workspace_id = ws_id)
        WHERE wm.workspace_id = ws_id
        GROUP BY u.id, u.name, u.email
      ) sub
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.workspace_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.invitations;
