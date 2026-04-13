import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { Task } from '@/types/database'
import { useActivityLogs } from './useActivityLogs'

export function useTasks(projectId: string, workspaceId?: string | null) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { logAction } = useActivityLogs(undefined, undefined, workspaceId)

  const { data: tasks, isLoading, error, refetch } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, user:user_id(*)')
        .eq('project_id', projectId)
        .order('position', { ascending: true })
      
      if (error) throw error
      return data
    },
    enabled: !!projectId,
    retry: 2,
    staleTime: 15_000,
  })

  // Realtime subscription
  useEffect(() => {
    if (!projectId) return

    const channel = supabase
      .channel(`tasks-realtime-${projectId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'tasks',
        filter: `project_id=eq.${projectId}` 
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId, supabase, queryClient])

  const createTask = useMutation({
    mutationFn: async (task: Partial<Task>) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ 
           ...task, 
           user_id: user?.id,
           project_id: projectId
        }])
        .select()
        .single()
      
      if (error) throw error

      // Send notification to assigned member
      if (task.assigned_to && user) {
        const senderName = user.user_metadata?.full_name || user.email?.split('@')[0] || "Someone"
        
        await supabase
          .from('notifications')
          .insert([{
            user_id: task.assigned_to,
            type: 'task_assigned',
            title: 'New Task Assigned',
            message: `${senderName} assigned you a new task: "${task.title}"`,
            metadata: { task_id: data.id, project_id: projectId, workspace_id: workspaceId }
          }])
      }

      // Log the activity (Non-blocking)
      try {
        if (user && workspaceId) {
          const senderName = user.user_metadata?.full_name || user.email?.split('@')[0] || "Someone"
          logAction.mutate({
            action_type: 'task_created',
            entity_type: 'task',
            entity_id: data.id,
            message: `${senderName} created task: "${data.title}"`,
            workspace_id: workspaceId
          })
        }
      } catch (logErr) {
        console.warn("Activity log could not be recorded:", logErr)
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
    }
  })

  const updateTask = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<Task> }) => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      // If we are reassigned, we need the task title for the notification
      let taskTitle = updates.title
      if (updates.assigned_to && !taskTitle) {
        const { data: current } = await supabase.from('tasks').select('title').eq('id', id).single()
        taskTitle = current?.title
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error

      // Log the activity (Non-blocking)
      try {
        if (currentUser && workspaceId) {
          const senderName = currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || "Someone"
          let actionMessage = `${senderName} updated task: "${taskTitle}"`
          let actionType = 'task_updated'

          if (updates.status) {
              actionType = 'status_changed'
              actionMessage = `${senderName} moved task to "${updates.status.toUpperCase()}"`
          }

          if (updates.assigned_to) {
              actionType = 'task_reassigned'
              actionMessage = `${senderName} reassigned task: "${taskTitle}"`
          }

          logAction.mutate({
            action_type: actionType,
            entity_type: 'task',
            entity_id: id,
            message: actionMessage,
            workspace_id: workspaceId,
            metadata: { updates }
          })
        }
      } catch (logErr) {
        console.warn("Activity log could not be recorded:", logErr)
      }

      // Send notification to NEW assignee if changed
      if (updates.assigned_to && currentUser) {
        const senderName = currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || "Someone"
        
        await supabase
          .from('notifications')
          .insert([{
            user_id: updates.assigned_to,
            type: 'task_assigned',
            title: 'Task Re-assigned',
            message: `${senderName} re-assigned you a task: "${taskTitle}"`,
            metadata: { task_id: id, project_id: projectId, workspace_id: workspaceId }
          }])
      }

      return data
    },
    onMutate: async ({ id, updates }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['tasks', projectId] })

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData(['tasks', projectId])

      // Optimistically update to the new value
      queryClient.setQueryData(['tasks', projectId], (old: any[] | undefined) => {
        if (!old) return []
        return old.map(task => 
          task.id === id ? { ...task, ...updates } : task
        )
      })

      // Return a context object with the snapshotted value
      return { previousTasks }
    },
    onError: (err, variables, context) => {
      // Rollback to the previous value if the mutation fails
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', projectId], context.previousTasks)
      }
    },
    onSettled: () => {
      // Always refetch after error or success to keep server sync
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
    }
  })

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
      
      if (error) throw error

      // Log the activity (Non-blocking)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user && workspaceId) {
            const senderName = user.user_metadata?.full_name || user.email?.split('@')[0] || "Someone"
            logAction.mutate({
            action_type: 'task_deleted',
            entity_type: 'task',
            entity_id: taskId,
            message: `${senderName} deleted a task`,
            workspace_id: workspaceId
            })
        }
      } catch (logErr) {
        console.warn("Activity log could not be recorded:", logErr)
      }
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      
      // Check if project is empty after deletion and purge if necessary
      const { count } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);
      
      if (count === 0) {
        await supabase.from('projects').delete().eq('id', projectId);
        queryClient.invalidateQueries({ queryKey: ['projects'] });
      }
    }
  })

  return {
    tasks,
    isLoading,
    error,
    refetch,
    createTask,
    updateTask,
    deleteTask
  }
}
