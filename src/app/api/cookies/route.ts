import {NextRequest, NextResponse} from 'next/server';
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const baseOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      path: "/",
      sameSite: "lax" as const,
    };

    const cookieStore = await cookies();

    // Define allowed keys and their corresponding cookie names
    const allowedKeys: Record<string, string> = {
      new_email: "@new_email",
      code: "@code",
      pass_updated: "@pass_updated",
    };

    let success = false;

    for (const [key, cookieName] of Object.entries(allowedKeys)) {
      if (key in body) {
        const value = body[key];
        cookieStore.set(cookieName, value, {
          maxAge: body.maxAge,
          ...baseOptions,
        });
        success = true;
      }
    }

    if (success) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({cookies: request.cookies}, {
    status: 200,
  });
}

export async function DELETE(request: Request) {
  const body = await request.json();
  const cookieStore = await cookies();

  const validKeys = ["@new_email", "@code", "@pass_updated"];
  let deleted = false;

  for (const key of validKeys) {
    if (key.slice(1) in body) {
      cookieStore.delete(key);
      deleted = true;
    }
  }
  return NextResponse.json({ success: deleted }, { status: deleted ? 200 : 400 });
}
