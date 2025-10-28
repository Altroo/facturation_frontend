import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/reset-password",
  "/set-password",
  "/enter-code",
  "/dashboard"
];

export default auth((req) => {
  const pathname = req.nextUrl.pathname;

  // allow public paths without redirect
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const token = req.auth?.accessToken;
  const isAuthorized = !!token;

  if (!isAuthorized) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
