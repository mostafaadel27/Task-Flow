import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { Invitation, WorkspaceRole } from '@/types/database'
import { useEffect } from 'react'
import { useActivityLogs } from './useActivityLogs'

export function useInvitations(workspaceId: string | null | undefined) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { logAction } = useActivityLogs(undefined, undefined, workspaceId)

  // Get all invitations for the current workspace (admin view)
  const { data: invitations, isLoading } = useQuery({
    queryKey: ['invitations', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return []

      const { data, error } = await supabase
        .from('invitations')
        .select('*, workspace:workspaces(*), inviter:users!invited_by(*)')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return (data || []) as Invitation[]
    },
    enabled: !!workspaceId,
    staleTime: 15_000,
  })

  // Get pending invitations for the current user (invitee view)
  const { data: myInvitations, isLoading: myInvitationsLoading } = useQuery({
    queryKey: ['my-invitations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) return []

      const { data, error } = await supabase
        .from('invitations')
        .select('*, workspace:workspaces(*), inviter:users!invited_by(*)')
        .eq('email', user.email.toLowerCase())
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching my invitations:', error)
        throw error
      }
      return (data || []) as Invitation[]
    },
    staleTime: 15_000,
  })

  // Realtime: invitation changes
  useEffect(() => {
    const channelId = `invitations-realtime-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'invitations',
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['invitations'] })
        queryClient.invalidateQueries({ queryKey: ['my-invitations'] })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, queryClient])

  // Send an invitation
  const sendInvitation = useMutation({
    mutationFn: async ({ email, role }: { email: string, role: WorkspaceRole }) => {
      if (!workspaceId) throw new Error('No workspace')

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Check for existing pending invitation
      const { data: existing } = await supabase
        .from('invitations')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('email', email.toLowerCase())
        .eq('status', 'pending')
        .maybeSingle()

      if (existing) {
        throw new Error('DUPLICATE: An invitation is already pending for this email.')
      }

      // Check if user is already a member
      const { data: lookupResults } = await supabase
        .rpc('lookup_user_by_email', { lookup_email: email.toLowerCase() })
      
      const existingUser = lookupResults?.[0] || null

      if (existingUser) {
        const { data: alreadyMember } = await supabase
          .from('workspace_members')
          .select('id')
          .eq('workspace_id', workspaceId)
          .eq('user_id', existingUser.id)
          .maybeSingle()

        if (alreadyMember) {
          throw new Error('ALREADY_MEMBER: This user is already a member of your workspace.')
        }
      }

      // Don't allow inviting yourself
      if (email.toLowerCase() === user.email?.toLowerCase()) {
        throw new Error('SELF_INVITE: You cannot invite yourself.')
      }

      // Create invitation
      const { data: invitation, error } = await supabase
        .from('invitations')
        .insert([{
          workspace_id: workspaceId,
          email: email.toLowerCase(),
          role,
          invited_by: user.id,
        }])
        .select()
        .single()
      
      if (error) throw error

      // Send notification if user exists on the platform
      if (existingUser) {
        const senderName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Someone'
        
        const { data: ws } = await supabase
          .from('workspaces')
          .select('name')
          .eq('id', workspaceId)
          .single()

        await supabase
          .from('notifications')
          .insert([{
            user_id: existingUser.id,
            type: 'workspace_invite',
            title: 'Workspace Invitation',
            message: `${senderName} invited you to join "${ws?.name || 'a workspace'}" as ${role}.`,
            metadata: { 
              invitation_id: invitation.id, 
              workspace_id: workspaceId,
              workspace_name: ws?.name,
              role 
            }
          }])
      }

      return invitation
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] })
    }
  })

  // Accept an invitation
  const acceptInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      // 1. Get invitation details for logging
      const { data: inv } = await supabase
        .from('invitations')
        .select('workspace_id, invited_by')
        .eq('id', invitationId)
        .single()

      // 2. Accept
      const { error } = await supabase.rpc('accept_invitation', { invitation_id: invitationId })
      if (error) throw error

      // 3. Log activity
      if (inv) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const name = user.user_metadata?.full_name || user.email?.split('@')[0] || "New Member"
          logAction.mutate({
            action_type: 'user_joined',
            entity_type: 'user',
            entity_id: user.id,
            message: `${name} joined the workspace`,
            workspace_id: inv.workspace_id
          })

          // 4. Mark notification as read (instead of deleting)
          await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', user.id)
            .eq('type', 'workspace_invite')
            .filter('metadata->>invitation_id', 'eq', invitationId)
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-invitations'] })
      queryClient.invalidateQueries({ queryKey: ['workspace'] })
      queryClient.invalidateQueries({ queryKey: ['workspace-members'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  // Reject an invitation
  const rejectInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      // 1. Get user for notification cleanup
      const { data: { user } } = await supabase.auth.getUser()

      // 2. Reject
      const { error } = await supabase.rpc('reject_invitation', { invitation_id: invitationId })
      if (error) throw error

      // 3. Mark notification as read (instead of deleting)
      if (user) {
        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('user_id', user.id)
          .eq('type', 'workspace_invite')
          .filter('metadata->>invitation_id', 'eq', invitationId)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-invitations'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  // Revoke a pending invitation (admin action)
  const revokeInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] })
    }
  })

  const pendingInvitations = invitations?.filter(i => i.status === 'pending') || []

  return {
    invitations: invitations || [],
    pendingInvitations,
    myInvitations: myInvitations || [],
    isLoading,
    myInvitationsLoading,
    sendInvitation,
    acceptInvitation,
    rejectInvitation,
    revokeInvitation,
  }
}
