import { cookies } from 'next/headers';
import SetPasswordClient from '@/components/pages/setPassword';

export default async function Page() {
  const cookieStore = await cookies();
  const email = cookieStore.get('@new_email')?.value ?? '';
  const code = cookieStore.get('@code')?.value ?? '';

  return <SetPasswordClient email={email} code={code} />;
}
