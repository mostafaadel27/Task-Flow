import { RoleGuard } from "@/components/RoleGuard";

export default async function AnalyticsLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  return (
    <RoleGuard workspaceId={workspaceId} requiredPermission="view_team_dashboard">
      {children}
    </RoleGuard>
  );
}
