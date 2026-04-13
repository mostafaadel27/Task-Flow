export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export type WorkspaceRole = 'owner' | 'admin' | 'member';
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string | null;
  created_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  created_by: string | null;
  created_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  created_at: string;
  // Joined data
  user?: User;
}

export interface Invitation {
  id: string;
  workspace_id: string;
  email: string;
  role: WorkspaceRole;
  status: InvitationStatus;
  invited_by: string | null;
  expires_at: string;
  created_at: string;
  // Joined data
  workspace?: Workspace;
  inviter?: User;
}

export interface Project {
  id: string;
  user_id: string;
  workspace_id: string | null;
  title: string;
  created_at: string;
  tasks?: Task[];
}

export interface Task {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to: string | null;
  assignee_email?: string | null;
  due_date: string | null;
  subtasks?: any[] | null;
  blocker?: string | null;
  position: number;
  created_at: string;
  // Joined data
  assignee?: User;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: 'free' | 'pro' | string;
  status: string;
  stripe_customer_id: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  metadata: any;
  created_at: string;
}

export interface WorkspaceStats {
  total_members: number;
  total_projects: number;
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  overdue_tasks: number;
  tasks_per_user: {
    name: string;
    email: string;
    active_tasks: number;
    completed_tasks: number;
    total_tasks: number;
  }[];
}
