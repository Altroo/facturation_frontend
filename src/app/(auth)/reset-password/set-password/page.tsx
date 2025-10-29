import { cookies } from 'next/headers';
import SetPasswordClient from '@/components/pages/setPassword';
import { redirect } from 'next/navigation';
import {AUTH_RESET_PASSWORD} from "@/utils/routes";

export default async function Page() {
  const cookieStore = await cookies();
  const email = cookieStore.get('@new_email')?.value ?? '';
  const code = cookieStore.get('@code')?.value ?? '';
  if (!email || !code) {
    redirect(AUTH_RESET_PASSWORD);
  }
  return <SetPasswordClient email={email} code={code} />;
}
