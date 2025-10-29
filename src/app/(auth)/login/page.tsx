import { redirect } from "next/navigation";
import { auth } from "@/auth";
import LoginClient from "@/components/pages/auth/login";
import {DASHBOARD} from "@/utils/routes";

export default async function LoginPage() {
  const session = await auth();

  if (session) {
    redirect(DASHBOARD);
  }

  return <LoginClient />;
}
