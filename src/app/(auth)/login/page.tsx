import { redirect } from "next/navigation";
import { auth } from "@/auth";
import LoginClient from "@/components/pages/auth/login";

export default async function LoginPage() {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  return <LoginClient />;
}
