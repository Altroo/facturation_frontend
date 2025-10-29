import { redirect } from "next/navigation";
import { auth } from "@/auth";
import ResetPasswordClient from "@/components/pages/auth/resetPassword";

export default async function ResetPasswordPage() {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  return <ResetPasswordClient />;
}
