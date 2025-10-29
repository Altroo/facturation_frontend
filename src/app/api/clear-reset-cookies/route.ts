import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  const cookieStore = res.cookies;
  cookieStore.delete('@pass_updated');
  cookieStore.delete('@new_email');
  cookieStore.delete('@code');
  return res;
}