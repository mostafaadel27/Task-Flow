-- 📄 TaskFlow Activity Log Migration (SQL)
-- Run this in your Supabase SQL Editor

-- 1. Create activity_logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL, -- 'task', 'project', 'user', 'workspace'
    entity_id UUID NOT NULL,
    action_type TEXT NOT NULL, -- 'task_created', 'status_changed', 'assigned', etc.
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 3. Create Visibility Policy
CREATE POLICY "Users can view workspace activity logs" ON public.activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members
            WHERE workspace_members.workspace_id = activity_logs.workspace_id
            AND workspace_members.user_id = auth.uid()
        )
    );

-- 4. Create Logger Policy
CREATE POLICY "Users can insert activity logs" ON public.activity_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Indexes for Pagination speed
CREATE INDEX IF NOT EXISTS idx_activity_logs_workspace ON public.activity_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON public.activity_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs(created_at DESC);
