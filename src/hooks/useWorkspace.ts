import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { Workspace, WorkspaceMember, WorkspaceRole } from '@/types/database'
import { useEffect } from 'react'

export function useWorkspace(workspaceId?: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  // Get specific workspace data
  const { data: workspace, isLoading: workspaceLoading } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return null
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('workspace_members')
        .select('workspace_id, role, workspaces(*)')
        .eq('user_id', user.id)
        .eq('workspace_id', workspaceId)
        .maybeSingle()
      
      if (error || !data) return null

      return {
        workspace: (data as any).workspaces as Workspace,
        role: data.role as WorkspaceRole,
        membershipId: data.workspace_id,
        user: user.id
      }
    },
    enabled: !!workspaceId,
    staleTime: 60_000,
  })

  // Get all workspace members for the current workspace
  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return []
      
      const { data, error } = await supabase
        .from('workspace_members')
        .select('*, user:user_id(*)')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      return (data || []) as (WorkspaceMember & { user: any })[]
    },
    enabled: !!workspaceId,
    staleTime: 30_000,
  })

  // Realtime: workspace member changes
  useEffect(() => {
    if (!workspaceId) return

    const channelId = `workspace-members-realtime-${workspaceId}-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'workspace_members',
        filter: `workspace_id=eq.${workspaceId}`
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [workspaceId, supabase, queryClient])

  // Create a new workspace
  const createWorkspace = useMutation({
    mutationFn: async (name: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create workspace
      const { data: ws, error: wsError } = await supabase
        .from('workspaces')
        .insert([{ name, created_by: user.id }])
        .select()
        .single()
      
      if (wsError) throw wsError

      // Add creator as owner
      const { error: memError } = await supabase
        .from('workspace_members')
        .insert([{ workspace_id: ws.id, user_id: user.id, role: 'owner' }])
      
      if (memError) throw memError

      return ws as Workspace
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace'] })
      queryClient.invalidateQueries({ queryKey: ['workspace-members'] })
    }
  })

  // Update workspace name
  const updateWorkspace = useMutation({
    mutationFn: async ({ id, name }: { id: string, name: string }) => {
      const { error } = await supabase
        .from('workspaces')
        .update({ name })
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace'] })
    }
  })

  // Change a member's role
  const changeRole = useMutation({
    mutationFn: async ({ memberId, newRole }: { memberId: string, newRole: WorkspaceRole }) => {
      const { error } = await supabase
        .from('workspace_members')
        .update({ role: newRole })
        .eq('id', memberId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members'] })
    }
  })

  // Remove a member from workspace
  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('id', memberId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members'] })
    }
  })

  // Leave workspace (current user)
  const leaveWorkspace = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !workspace?.workspace?.id) throw new Error('No workspace')

      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('workspace_id', workspace.workspace.id)
        .eq('user_id', user.id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace'] })
      queryClient.invalidateQueries({ queryKey: ['workspace-members'] })
    }
  })

  const currentRole = workspace?.role || null
  const isOwner = currentRole === 'owner'
  const isAdmin = currentRole === 'admin'
  const isOwnerOrAdmin = isOwner || isAdmin

  return {
    workspace: workspace?.workspace || null,
    currentRole,
    members: members || [],
    isLoading: workspaceLoading,
    membersLoading,
    isOwner,
    isAdmin,
    isOwnerOrAdmin,
    userId: workspace?.user || null,
    createWorkspace,
    updateWorkspace,
    changeRole,
    removeMember,
    leaveWorkspace,
  }
}
