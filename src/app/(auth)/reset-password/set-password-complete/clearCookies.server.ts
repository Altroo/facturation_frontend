'use server';

import { cookies } from 'next/headers';

async function clearResetCookies() {
  // read‑only on the server
  const cookieStore = await cookies();
  cookieStore.delete('@pass_updated');
  cookieStore.delete('@new_email');
  cookieStore.delete('@code');
}

export default clearResetCookies;