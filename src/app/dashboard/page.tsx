import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {AUTH_LOGIN} from "@/utils/routes";
import DashboardClient from "@/components/pages/dashboard/dashboard";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect(AUTH_LOGIN);
  }

  return <DashboardClient session={session} />;
}
