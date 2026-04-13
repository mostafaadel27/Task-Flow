import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { useEffect } from 'react'
import { useActivityLogs } from './useActivityLogs'

export function useMyTasks() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { logAction } = useActivityLogs()

  const { data: tasks, isLoading, error, refetch } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('tasks')
        .select('*, project:projects(title, workspace_id), user:user_id(*)')
        .eq('assigned_to', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('get_assigned_tasks', { employee_user_email: user.email })
        
        if (rpcError) throw rpcError
        return rpcData || []
      }
      
      return data || []
    },
  })

  useEffect(() => {
    const channel = supabase
      .channel('employee-tasks-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks'
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['my-tasks'] })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, queryClient])

  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string, status: string }) => {
      const { error } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', taskId)

      if (error) {
        const { error: rpcError } = await supabase
          .rpc('update_task_status_as_employee', { 
            task_id: taskId, 
            new_status: status 
          })
        if (rpcError) throw rpcError
      }

      // Log activity
      const cachedTasks = queryClient.getQueryData(['my-tasks']) as any[]
      const task = cachedTasks?.find(t => t.id === taskId)
      const workspaceId = task?.project?.workspace_id

      if (workspaceId) {
        const { data: { user } } = await supabase.auth.getUser()
        const senderName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Someone"
        
        logAction.mutate({
          workspace_id: workspaceId,
          entity_type: 'task',
          entity_id: taskId,
          action_type: 'status_changed',
          message: `${senderName} moved task to "${status.toUpperCase()}"`,
        })
      }
    },
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['my-tasks'] })
      const previousTasks = queryClient.getQueryData(['my-tasks'])

      queryClient.setQueryData(['my-tasks'], (old: any[] | undefined) => {
        if (!old) return []
        return old.map(task => 
          task.id === taskId ? { ...task, status } : task
        )
      })

      return { previousTasks }
    },
    onError: (err, variables, context: any) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['my-tasks'], context.previousTasks)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] })
    }
  })

  return {
    tasks,
    isLoading,
    error,
    refetch,
    updateTaskStatus,
  }
}
