import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {AUTH_LOGIN, DASHBOARD} from "@/utils/routes";

const HomePage = async () => {
  const session = await auth();

  if (session) {
    redirect(DASHBOARD);
  } else {
    redirect(AUTH_LOGIN);
  }
}

export default HomePage;