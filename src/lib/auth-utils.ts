import { cache } from 'react'
import { createClient } from '@/utils/supabase/server'
import { WorkspaceRole } from '@/types/database'

/**
 * Caches the current user's membership in a specific workspace.
 * Uses React.cache to ensure it only runs once per server request.
 */
export const getWorkspaceMembership = cache(async (workspaceId?: string) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  let query = supabase
    .from('workspace_members')
    .select('role, workspace_id, workspaces(name)')
    .eq('user_id', user.id)

  if (workspaceId) {
    query = query.eq('workspace_id', workspaceId)
  }

  const { data: membership } = await query.maybeSingle()
  
  return membership ? {
    role: membership.role as WorkspaceRole,
    workspaceId: membership.workspace_id,
    workspaceName: (membership.workspaces as any)?.name
  } : null
})

/**
 * Gets all workspaces the user belongs to.
 */
export const getUserWorkspaces = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []

  const { data: memberships } = await supabase
    .from('workspace_members')
    .select('role, workspace_id, workspaces(name, created_at)')
    .eq('user_id', user.id)
    .order('created_at', { referencedTable: 'workspaces', ascending: false })

  return memberships?.map(m => ({
    role: m.role as WorkspaceRole,
    workspaceId: m.workspace_id,
    workspaceName: (m.workspaces as any)?.name
  })) || []
})

/**
 * Gets or creates workspaces for the current user.
 * MOVED TO MANUAL ONBOARDING: This function is deprecated in favor of explicit getUserWorkspaces
 * and redirecting to /onboarding.
 */
// Removed to restore manual onboarding choice

/**
 * Creates a default workspace for a new user.
 */
export async function createDefaultWorkspace(userId: string, name: string) {
  const supabase = await createClient()
  
  // 1. Create the workspace
  const { data: workspace, error: wsError } = await supabase
    .from('workspaces')
    .insert({
      name: `${name}'s Workspace`,
      created_by: userId
    })
    .select()
    .single()

  if (wsError) throw wsError

  // 2. Add the user as owner
  const { error: memberError } = await supabase
    .from('workspace_members')
    .insert({
      workspace_id: workspace.id,
      user_id: userId,
      role: 'owner'
    })

  if (memberError) throw memberError

  return workspace
}
