import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { useEffect } from 'react'

export interface ActivityLog {
  id: string
  user_id: string
  workspace_id: string
  entity_type: 'task' | 'project' | 'user' | 'workspace'
  entity_id: string
  action_type: string
  message: string
  metadata: any
  created_at: string
  user?: {
    name: string
    email: string
  }
}

export function useActivityLogs(
  entityId?: string, 
  entityType?: string, 
  workspaceId?: string | null,
  filters?: { date?: string; type?: string; userId?: string }
) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const { data: logs, isLoading, error, refetch } = useQuery({
    queryKey: ['activity-logs', entityId || 'workspace', workspaceId, filters],
    queryFn: async () => {
      let query = supabase
        .from('activity_logs')
        .select('*, user:user_id(name, email)')
        .order('created_at', { ascending: false })
        .limit(100)

      if (entityId && entityType) {
        query = query.eq('entity_id', entityId).eq('entity_type', entityType)
      } else if (workspaceId) {
        query = query.eq('workspace_id', workspaceId)
      }

      // Apply Filters
      if (filters?.userId && filters.userId !== 'all') {
        query = query.eq('user_id', filters.userId)
      }

      if (filters?.type && filters.type !== 'all') {
        // Special case for grouped types
        if (filters.type === 'status_changed') {
          query = query.in('action_type', ['status_changed', 'task_completed'])
        } else {
          query = query.eq('action_type', filters.type)
        }
      }

      if (filters?.date) {
        const start = new Date(filters.date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(filters.date);
        end.setHours(23, 59, 59, 999);
        
        query = query.gte('created_at', start.toISOString()).lte('created_at', end.toISOString())
      }

      const { data, error } = await query
      if (error) throw error
      return data as ActivityLog[]
    },
    enabled: !!(entityId || workspaceId),
    staleTime: 5_000,
  })

  // Real-time listener
  useEffect(() => {
    if (!workspaceId) return

    const channelId = `activity-realtime-${workspaceId}-${entityId || 'all'}`;
    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'activity_logs',
        filter: workspaceId ? `workspace_id=eq.${workspaceId}` : undefined
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['activity-logs'] })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [workspaceId, entityId, supabase, queryClient])

  // Helper function to create a log
  const logAction = useMutation({
    mutationFn: async (params: {
      action_type: string
      message: string
      entity_id: string
      entity_type: string
      workspace_id: string
      metadata?: any
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('activity_logs')
        .insert([{
          user_id: user.id,
          workspace_id: params.workspace_id,
          entity_type: params.entity_type,
          entity_id: params.entity_id,
          action_type: params.action_type,
          message: params.message,
          metadata: params.metadata || {}
        }])
        .select()
        .single()
      
      if (error) {
        console.error('LOG_INSERT_ERROR:', error)
        throw error
      }
      return data
    }
  })

  return {
    logs,
    isLoading,
    error,
    refetch,
    logAction
  }
}
