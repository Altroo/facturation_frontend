import { redirect } from "next/navigation";
import { auth } from "@/auth";
import ResetPasswordClient from "@/components/pages/auth/resetPassword";
import {DASHBOARD} from "@/utils/routes";

export default async function ResetPasswordPage() {
  const session = await auth();

  if (session) {
    redirect(DASHBOARD);
  }

  return <ResetPasswordClient />;
}
