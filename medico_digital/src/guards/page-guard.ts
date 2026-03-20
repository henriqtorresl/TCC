import { NextRequest, NextResponse } from "next/server";

export function handlePageGuard(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith("/api");

  if (isApiRoute) {
    return null;
  }

  return null;
}
