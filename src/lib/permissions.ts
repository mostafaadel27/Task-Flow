import { WorkspaceRole } from '@/types/database';

/**
 * Centralized permission definitions for the workspace role system.
 * All client-side permission checks route through here.
 * Backend enforcement is handled by Supabase RLS policies.
 */

export type Permission =
  | 'manage_billing'
  | 'invite_users'
  | 'remove_users'
  | 'create_projects'
  | 'create_tasks'
  | 'assign_tasks'
  | 'edit_tasks'
  | 'delete_tasks'
  | 'manage_roles'
  | 'delete_workspace'
  | 'view_team_dashboard'
  | 'manage_workspace_settings';

const PERMISSION_MAP: Record<Permission, WorkspaceRole[]> = {
  manage_billing:            ['owner'],
  invite_users:              ['owner', 'admin'],
  remove_users:              ['owner', 'admin'],
  create_projects:           ['owner', 'admin'],
  create_tasks:              ['owner', 'admin', 'member'],
  assign_tasks:              ['owner', 'admin'],
  edit_tasks:                ['owner', 'admin'],       // members have limited edit (own tasks)
  delete_tasks:              ['owner', 'admin'],
  manage_roles:              ['owner'],
  delete_workspace:          ['owner'],
  view_team_dashboard:       ['owner', 'admin'],
  manage_workspace_settings: ['owner', 'admin'],
};

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: WorkspaceRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return PERMISSION_MAP[permission]?.includes(role) ?? false;
}

/**
 * Check if a role can perform an action on a task.
 * Members can edit/delete only their own tasks.
 */
export function canEditTask(
  role: WorkspaceRole | null | undefined,
  task: any,
  currentUserId: string
): boolean {
  if (!role) return false;
  if (role === 'owner' || role === 'admin') return true;
  return role === 'member' && (task.user_id === currentUserId || task.assigned_to === currentUserId);
}

/**
 * Check if a role can change another member's role.
 * Only owners can change roles; owners can't be demoted by anyone but themselves.
 */
export function canChangeRole(
  currentUserRole: WorkspaceRole | null | undefined,
  targetRole: WorkspaceRole
): boolean {
  if (currentUserRole !== 'owner') return false;
  return true;
}

/**
 * Get a human-readable label for a role.
 */
export function getRoleLabel(role: WorkspaceRole): string {
  const labels: Record<WorkspaceRole, string> = {
    owner: 'Owner',
    admin: 'Admin',
    member: 'Member',
  };
  return labels[role] || role;
}

/**
 * Get a description for a role.
 */
export function getRoleDescription(role: WorkspaceRole): string {
  const descriptions: Record<WorkspaceRole, string> = {
    owner: 'Full control over workspace, billing, and all members',
    admin: 'Can manage projects, tasks, and invite users',
    member: 'Can view and work on assigned tasks',
  };
  return descriptions[role] || '';
}

/**
 * Role hierarchy: higher index = more powerful.
 */
const ROLE_HIERARCHY: WorkspaceRole[] = ['member', 'admin', 'owner'];

export function isRoleHigherOrEqual(role: WorkspaceRole, thanRole: WorkspaceRole): boolean {
  return ROLE_HIERARCHY.indexOf(role) >= ROLE_HIERARCHY.indexOf(thanRole);
}
