import { WorkspaceRole } from '@/types/database'

const ROLE_STYLES: Record<WorkspaceRole, string> = {
  owner: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
  admin: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
  member: 'bg-muted text-muted-foreground border-border/50',
}

const ROLE_DOT_STYLES: Record<WorkspaceRole, string> = {
  owner: 'bg-amber-500',
  admin: 'bg-blue-500',
  member: 'bg-muted-foreground/50',
}

export function RoleBadge({ role, size = 'sm' }: { role: WorkspaceRole, size?: 'xs' | 'sm' }) {
  const label = role.charAt(0).toUpperCase() + role.slice(1)

  if (size === 'xs') {
    return (
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-widest border ${ROLE_STYLES[role]}`}>
        <span className={`w-1 h-1 ${ROLE_DOT_STYLES[role]}`} />
        {label}
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest border ${ROLE_STYLES[role]}`}>
      <span className={`w-1.5 h-1.5 ${ROLE_DOT_STYLES[role]}`} />
      {label}
    </span>
  )
}
