import { cookies } from 'next/headers';
import SetPasswordComplete from '@/components/pages/setPasswordComplete';
import ClearCookiesClient from './clearCookiesClient';
import { redirect } from 'next/navigation';
import {AUTH_RESET_PASSWORD, DASHBOARD} from "@/utils/routes";
import {auth} from "@/auth";

export default async function Page() {
  // check if user is logged in
  const session = await auth();
  if (session) {
    // user is already logged in → redirect to dashboard
    redirect(DASHBOARD);
  }

  const cookieStore = await cookies();
  const passUpdated = cookieStore.get('@pass_updated')?.value ?? '';
  if (!passUpdated) {
    redirect(AUTH_RESET_PASSWORD);
  }
  return (
    <>
      {passUpdated && <ClearCookiesClient />}
      <SetPasswordComplete />
    </>
  );
}
