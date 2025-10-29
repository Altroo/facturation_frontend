import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {AUTH_LOGIN, DASHBOARD} from "@/utils/routes";

export default async function HomePage() {
  const session = await auth();

  if (session) {
    redirect(DASHBOARD);
  } else {
    redirect(AUTH_LOGIN);
  }
}
