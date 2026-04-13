import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { Project } from '@/types/database'
import { useActivityLogs } from './useActivityLogs'

export function useProjects(workspaceId?: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { logAction } = useActivityLogs(undefined, undefined, workspaceId)

  const { data: projects, isLoading, error, refetch } = useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];

      // 1. Fetch projects with their tasks count for this specific workspace
      const { data, error } = await supabase
        .from('projects')
        .select('*, tasks(id, status), user:user_id(*)')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.warn("Supabase fetch projects error:", error)
        return []
      }

      // 2. Identify projects with ZERO tasks AND older than 5 minutes (Grace Period)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const emptyProjectIds = (data || [])
        .filter(p => (!p.tasks || p.tasks.length === 0) && new Date(p.created_at) < fiveMinutesAgo)
        .map(p => p.id);

      // 3. Purge empty projects immediately
      if (emptyProjectIds.length > 0) {
        await supabase
          .from('projects')
          .delete()
          .in('id', emptyProjectIds);
        
        // Return only non-purged projects
        return (data || []).filter(p => !emptyProjectIds.includes(p.id));
      }

      return data || []
    },
    enabled: !!workspaceId,
    retry: 2,
    staleTime: 5_000,
  })

  // Realtime subscription
  useEffect(() => {
    if (!workspaceId) return

    const channel = supabase
      .channel(`projects-realtime-${workspaceId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'projects',
        filter: `workspace_id=eq.${workspaceId}` 
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] })
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks'
      }, () => {
        // Any change to ANY task might affect project progress
        queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [workspaceId, supabase, queryClient])

  const createProject = useMutation({
    mutationFn: async (title: string) => {
      if (!workspaceId) throw new Error("Workspace ID is required");
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data: project, error: pError } = await supabase
        .from('projects')
        .insert([{ 
          title, 
          user_id: user.id,
          workspace_id: workspaceId
        }])
        .select()
        .single()
      
      if (pError) throw pError

      // Log the activity
      if (user && workspaceId) {
        const senderName = user.user_metadata?.full_name || user.email?.split('@')[0] || "Someone"
        logAction.mutate({
          action_type: 'project_created',
          entity_type: 'project',
          entity_id: project.id,
          message: `${senderName} created project: "${title}"`,
          workspace_id: workspaceId
        })
      }

      return project
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] })
    }
  })

  const deleteProject = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
      
      if (error) throw error

      // Log the activity
      const { data: { user } } = await supabase.auth.getUser()
      if (user && workspaceId) {
        const senderName = user.user_metadata?.full_name || user.email?.split('@')[0] || "Someone"
        logAction.mutate({
          action_type: 'project_deleted',
          entity_type: 'project',
          entity_id: projectId,
          message: `${senderName} deleted a project`,
          workspace_id: workspaceId
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] })
    }
  })

  const updateProject = useMutation({
    mutationFn: async ({ id, title }: { id: string, title: string }) => {
      const { data, error } = await supabase
        .from('projects')
        .update({ title })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] })
    }
  })

  return {
    projects,
    isLoading,
    error,
    refetch,
    createProject,
    updateProject,
    deleteProject
  }
}
