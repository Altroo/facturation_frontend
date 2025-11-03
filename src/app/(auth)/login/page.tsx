import { redirect } from "next/navigation";
import { auth } from "@/auth";
import LoginClient from "@/components/pages/auth/login/login";
import {DASHBOARD} from "@/utils/routes";

const LoginPage = async () => {
  const session = await auth();

  if (session) {
    redirect(DASHBOARD);
  }

  return <LoginClient />;
}

export default LoginPage