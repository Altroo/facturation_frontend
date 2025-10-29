import { cookies } from 'next/headers';
import SetPasswordComplete from '@/components/pages/auth/setPasswordComplete';
import ClearCookiesClient from './clearCookiesClient';
import { redirect } from 'next/navigation';
import { AUTH_RESET_PASSWORD, DASHBOARD } from "@/utils/routes";
import { auth } from "@/auth";

export default async function Page() {
  const session = await auth();
  if (session) {
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