import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getWorkspaceMembership } from '@/lib/auth-utils';
import { Permission, hasPermission } from '@/lib/permissions';

interface RoleGuardProps {
  children: ReactNode;
  workspaceId: string;
  requiredPermission?: Permission;
}

/**
 * Server-side Role Guard for protecting pages or segments.
 */
export async function RoleGuard({ 
  children, 
  workspaceId, 
  requiredPermission 
}: RoleGuardProps) {
  const membership = await getWorkspaceMembership(workspaceId);

  if (!membership) {
    redirect('/dashboard'); // Or some error page
  }

  if (requiredPermission && !hasPermission(membership.role, requiredPermission)) {
    // Redirect to dashboard if they don't have permission for this specific area
    redirect(`/ws/${workspaceId}/dashboard`);
  }

  return <>{children}</>;
}
