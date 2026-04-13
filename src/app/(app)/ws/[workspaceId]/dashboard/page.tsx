import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "./DashboardClient";
import { getWorkspaceMembership } from "@/lib/auth-utils";

export const metadata = {
  title: "Dashboard | TaskFlow",
  description: "Overview of your projects and tasks.",
};

export default async function DashboardPage({
  params
}: {
  params: { workspaceId: string };
}) {
  const { workspaceId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user role for this specific workspace
  const membership = await getWorkspaceMembership(workspaceId);
  
  if (!membership) {
    redirect('/'); // User is not a member of this workspace
  }

  const role = membership.role;
  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User";

  // Fetch projects specifically for this workspace
  const { data: projects } = await supabase
    .from('projects')
    .select('*, tasks(*)')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  // Role-based filtering
  let filteredProjects = (projects || []) as any[];
  
  if (role === 'member') {
    // Only keep projects that the user has tasks in, or tasks assigned to them
    filteredProjects = filteredProjects.map(p => ({
      ...p,
      tasks: (p.tasks || []).filter((t: any) => t.assigned_to === user.id || t.user_id === user.id)
    }));
  }

  // Filter out projects that have no visible tasks for members
  if (role === 'member') {
    filteredProjects = filteredProjects.filter(p => (p.tasks?.length || 0) > 0);
  }
  
  // Flatten tasks for global stats
  let filteredTasks = filteredProjects.flatMap((p: any) => p.tasks) || [];

  const totalProjects = filteredProjects.length;
  const activeTasks = filteredTasks.filter((t: any) => t.status !== 'done').length;
  const completedTasks = filteredTasks.filter((t: any) => t.status === 'done').length;
  
  const upNextTasks = filteredTasks
    .filter((t: any) => t.status !== 'done')
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const isNewUser = totalProjects === 0 && filteredTasks.length === 0;

  return (
    <DashboardClient 
      name={name}
      role={role}
      totalProjects={totalProjects}
      activeTasks={activeTasks}
      completedTasks={completedTasks}
      recentProjects={filteredProjects.slice(0, 5)}
      upNextTasks={upNextTasks}
      isNewUser={isNewUser}
      allProjects={filteredProjects}
      workspaceId={workspaceId}
    />
  );
}
