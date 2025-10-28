import { cookies } from 'next/headers';
import SetPasswordComplete from '@/components/pages/setPasswordComplete';
import ClearCookiesClient from './clearCookiesClient';

export default async function Page() {
  const cookieStore = await cookies();
  const passUpdated = cookieStore.get('@pass_updated')?.value ?? '';

  return (
    <>
      {passUpdated && <ClearCookiesClient />}
      <SetPasswordComplete />
    </>
  );
}
