import { cookies } from 'next/headers';
import SetPasswordComplete from '@/components/pages/setPasswordComplete';
import ClearCookiesClient from './clearCookiesClient';
import { redirect } from 'next/navigation';
import {AUTH_RESET_PASSWORD} from "@/utils/routes";

export default async function Page() {
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
