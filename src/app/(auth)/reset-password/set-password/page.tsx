import { cookies } from 'next/headers';
import SetPasswordClient from '@/components/pages/setPassword';
import { redirect } from 'next/navigation';
import {AUTH_RESET_PASSWORD, DASHBOARD} from "@/utils/routes";
import { auth } from "@/auth";

export default async function Page() {
  // check if user is logged in
  const session = await auth();
  if (session) {
    // user is already logged in → redirect to dashboard
    redirect(DASHBOARD);
  }

  const cookieStore = await cookies();
  const email = cookieStore.get('@new_email')?.value ?? '';
  const code = cookieStore.get('@code')?.value ?? '';
  if (!email || !code) {
    redirect(AUTH_RESET_PASSWORD);
  }
  return <SetPasswordClient email={email} code={code} />;
}
