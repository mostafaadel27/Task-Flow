import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { WorkspaceMember, WorkspaceRole, User } from '@/types/database'
import { useEffect } from 'react'

export interface TeamMember extends WorkspaceMember {
  user: User;
}

export function useTeam(workspaceId?: string | null) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const { data: members, isLoading, error, refetch } = useQuery({
    queryKey: ['team', workspaceId],
    queryFn: async () => {
      if (!workspaceId) {
        // Fallback: try to get the current user's workspace
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return []

        const { data: membership } = await supabase
          .from('workspace_members')
          .select('workspace_id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle()

        if (!membership) return []
        workspaceId = membership.workspace_id
      }

      const { data, error } = await supabase
        .from('workspace_members')
        .select('*, user:users(*)')
        .eq('workspace_id', workspaceId)
        .order('role', { ascending: true }) // owner first, then admin, then member
        .order('created_at', { ascending: true })
      
      if (error) throw error
      return (data || []) as TeamMember[]
    },
    retry: 2,
    staleTime: 30_000,
  })

  // Realtime updates
  useEffect(() => {
    if (!workspaceId) return

    const channelId = `team-${workspaceId}-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'workspace_members',
        filter: `workspace_id=eq.${workspaceId}`
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['team'] })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [workspaceId, supabase, queryClient])

  const addMember = useMutation({
    mutationFn: async ({ userId, role }: { userId: string, role: WorkspaceRole }) => {
      if (!workspaceId) throw new Error('No workspace')

      const { data, error } = await supabase
        .from('workspace_members')
        .insert([{ workspace_id: workspaceId, user_id: userId, role }])
        .select('*, user:users(*)')
        .single()
      
      if (error) throw error
      return data as TeamMember
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] })
      queryClient.invalidateQueries({ queryKey: ['workspace-members'] })
    }
  })

  const updateRole = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string, role: WorkspaceRole }) => {
      const { error } = await supabase
        .from('workspace_members')
        .update({ role })
        .eq('id', memberId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] })
      queryClient.invalidateQueries({ queryKey: ['workspace-members'] })
    }
  })

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('id', memberId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] })
      queryClient.invalidateQueries({ queryKey: ['workspace-members'] })
    }
  })

  return {
    members: members || [],
    isLoading,
    error,
    refetch,
    addMember,
    updateRole,
    removeMember,
  }
}
