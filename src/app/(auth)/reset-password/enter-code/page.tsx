import { cookies } from 'next/headers';
import React from 'react';
import EnterCodeClient from '@/components/pages/enterCode';
import { redirect } from 'next/navigation';
import {AUTH_RESET_PASSWORD} from "@/utils/routes";

export default async function Page() {
  const cookieStore = await cookies();
  const email = cookieStore.get('@new_email')?.value ?? '';
  if (!email) {
    redirect(AUTH_RESET_PASSWORD);
  }
  return <EnterCodeClient email={email} />;
}
