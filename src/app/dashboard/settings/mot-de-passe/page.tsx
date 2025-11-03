import { redirect } from "next/navigation";
import { auth } from "@/auth";
import MotDePasseClient from "@/components/pages/dashboard/settings/mot-de-passe";
import {AUTH_LOGIN} from "@/utils/routes";

const EditPasswordPage = async () => {
  const session = await auth();

  if (!session) {
    redirect(AUTH_LOGIN);
  }

  return <MotDePasseClient session={session} />;
}

export default EditPasswordPage;