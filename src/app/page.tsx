import { createClient } from "@/utils/supabase/server";
import { getUserWorkspaces } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { LandingPage } from "@/components/LandingPage";

export default async function RootPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const workspaces = await getUserWorkspaces();
    
    // If user has workspaces, go to dashboard
    if (workspaces.length > 0) {
      redirect(`/ws/${workspaces[0].workspaceId}/dashboard`);
    } else {
      // If user is new and has no workspaces, go to onboarding
      redirect("/onboarding");
    }
  }

  return <LandingPage />;
}
