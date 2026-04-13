import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { WorkspaceStats } from '@/types/database'

export function useTeamDashboard(workspaceId: string | null | undefined) {
  const supabase = createClient()

  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ['team-dashboard', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return null

      const { data, error } = await supabase
        .rpc('get_workspace_stats', { ws_id: workspaceId })
      
      if (error) throw error
      return data as WorkspaceStats
    },
    enabled: !!workspaceId,
    staleTime: 30_000,
    refetchInterval: 60_000, // Auto-refresh every minute
  })

  return {
    stats,
    isLoading,
    error,
    refetch,
  }
}
