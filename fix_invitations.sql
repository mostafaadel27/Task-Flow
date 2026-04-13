-- 📄 TaskFlow Fix: Invitation Case Sensitivity & Missing Notifications
-- Run this in your Supabase SQL Editor

-- 1. Update Invitation Select Policy to be case-insensitive
DROP POLICY IF EXISTS "Owner/Admin can view invitations" ON public.invitations;
CREATE POLICY "Owner/Admin can view invitations" ON public.invitations
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members wm
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin')
    )
    OR lower(email) IN (SELECT lower(email) FROM public.users WHERE id = auth.uid())
  );

-- 2. Create optimized user lookup function (Security Definer to bypass individual RLS)
CREATE OR REPLACE FUNCTION public.lookup_user_by_email(lookup_email TEXT)
RETURNS TABLE (id UUID, name TEXT, email TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.name, u.email
  FROM public.users u
  WHERE lower(u.email) = lower(lookup_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger to notify new users of pending invitations
CREATE OR REPLACE FUNCTION public.handle_new_user_invitation_notify()
RETURNS TRIGGER AS $$
DECLARE
  inv RECORD;
  sender_name TEXT;
  ws_name TEXT;
BEGIN
  -- Find any pending invitations for this new user's email
  FOR inv IN 
    SELECT i.*, w.name as workspace_name, u.name as inviter_name
    FROM public.invitations i
    JOIN public.workspaces w ON i.workspace_id = w.id
    LEFT JOIN public.users u ON i.invited_by = u.id
    WHERE lower(i.email) = lower(NEW.email) AND i.status = 'pending'
  LOOP
    sender_name := COALESCE(inv.inviter_name, 'Someone');
    ws_name := COALESCE(inv.workspace_name, 'a workspace');

    -- Insert notification for the NEW user
    INSERT INTO public.notifications (user_id, type, title, message, metadata)
    VALUES (
      NEW.id,
      'workspace_invite',
      'Workspace Invitation',
      sender_name || ' invited you to join "' || ws_name || '" as ' || inv.role || '.',
      jsonb_build_object(
        'invitation_id', inv.id,
        'workspace_id', inv.workspace_id,
        'workspace_name', ws_name,
        'role', inv.role
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to public.users (not auth.users, because public.users is where we have names and profile info)
DROP TRIGGER IF EXISTS on_public_user_created_notify_invitations ON public.users;
CREATE TRIGGER on_public_user_created_notify_invitations
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_invitation_notify();
