import { createClient } from "@/utils/supabase/server";
import { getUserWorkspaces } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { LandingPage } from "@/components/LandingPage";

export const dynamic = 'force-dynamic';

export default async function RootPage() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const workspaces = await getUserWorkspaces();
      
      if (workspaces.length > 0) {
        return redirect(`/ws/${workspaces[0].workspaceId}/dashboard`);
      } else {
        return redirect("/onboarding");
      }
    }
  } catch (error: any) {
    if (error.message === 'NEXT_REDIRECT') throw error;
    console.error("Supabase initialization error:", error);
  }

  return <LandingPage />;
}
