import {NextRequest, NextResponse} from 'next/server';
import {deleteCookie, setCookie} from '@/utils/cookies';

export async function POST(request: NextRequest) {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    path: '/',
  };
  const query = await request.json();
  if ('initStateToken' in query) {
    return setCookie('@initStateToken', query.initStateToken, {
      maxAge: query.maxAge,
      sameSite: 'lax',
      ...options,
    });
  }
  return NextResponse.json({success: false}, {status: 400});
}

export async function GET(request: NextRequest) {
  return NextResponse.json({cookies: request.cookies}, {
    status: 200,
  });
}

export async function DELETE(request: NextRequest) {
  const options = {
    maxAge: -1,
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
  };
  const query = await request.json();
  if ('initStateToken' in query) {
    return deleteCookie('@initStateToken', {
      sameSite: 'lax',
      ...options,
    });
  }
  return NextResponse.json({success: false}, {status: 400});
}