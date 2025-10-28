import { cookies } from 'next/headers';
import React from 'react';
import EnterCodeClient from '@/components/pages/enterCode';

export default async function Page() {
  const cookieStore = await cookies();
  const email = cookieStore.get('@new_email')?.value ?? '';

  return <EnterCodeClient email={email} />;
}
