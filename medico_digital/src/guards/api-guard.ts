import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE_NAME = "md_refresh_token";

const publicRoutes = [
  "/api/auth",
  "/api/docs",
  "/api/openapi.json",
  "/api/health",
];

export function handleApiGuard(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith("/api");
  const isPublicRoute = publicRoutes.some((path) => pathname.startsWith(path));

  if (isPublicRoute || !isApiRoute) {
    return null; // Retorna null para o middleware continuar avaliando os proximos guards.
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
