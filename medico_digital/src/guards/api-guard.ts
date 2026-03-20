import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE_NAME = "md_refresh_token";

export function handleApiGuard(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/docs") ||
    pathname.startsWith("/api/openapi.json") ||
    pathname.startsWith("/api/health") ||
    !pathname.startsWith("/api")
  ) {
    return null;
  }

  const authCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (authCookie) {
    return null;
  }

  return NextResponse.json(
    {
      error: {
        code: "unauthorized",
        message: "Autenticacao obrigatoria para acessar este recurso.",
      },
    },
    { status: 401 },
  );
}
