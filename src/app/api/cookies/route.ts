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

    if ("initStateToken" in body) {
      (await cookies()).set("@initStateToken", body.initStateToken, {
        maxAge: body.maxAge,
        ...baseOptions,
      });

      return NextResponse.json({ success: true });
    }

    if ("new_email" in body) {
      (await cookies()).set("@new_email", body.new_email, {
        maxAge: body.maxAge,
        ...baseOptions,
      });
      return NextResponse.json({ success: true });
    }

    if ("code" in body) {
      (await cookies()).set("@code", body.code, {
        maxAge: body.maxAge,
        ...baseOptions,
      });
      return NextResponse.json({ success: true });
    }

    if ("pass_updated" in body) {
      (await cookies()).set("@pass_updated", body.pass_updated, {
        maxAge: body.maxAge,
        ...baseOptions,
      });
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

  if ("initStateToken" in body) {
    (await cookies()).delete("@initStateToken");

    return NextResponse.json({ success: true }, { status: 200 });
  }
  if ("new_email" in body) {
    (await cookies()).delete("@new_email");

    return NextResponse.json({ success: true }, { status: 200 });
  }
  if ("code" in body) {
    (await cookies()).delete("@code");

    return NextResponse.json({ success: true }, { status: 200 });
  }
  if ("pass_updated" in body) {
    (await cookies()).delete("@pass_updated");

    return NextResponse.json({ success: true }, { status: 200 });
  }

  return NextResponse.json({ success: false }, { status: 400 });
}
