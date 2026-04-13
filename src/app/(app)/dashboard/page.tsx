import { redirect } from "next/navigation";

/**
 * Legacy redirect for /dashboard to the new workspace-based routing.
 */
export default function DashboardRedirect() {
  redirect("/");
}
