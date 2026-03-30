import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE_NAME = "md_refresh_token";
const authPages = ["/login", "/register"];

function isStaticAsset(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  );
}

export function handlePageGuard(request: NextRequest): NextResponse | null {
  const { pathname, search } = request.nextUrl;
  const isApiRoute = pathname.startsWith("/api");
  const isAuthPage = authPages.includes(pathname);
  const hasAuthCookie = Boolean(request.cookies.get(AUTH_COOKIE_NAME)?.value);

  if (isApiRoute || isStaticAsset(pathname)) {
    return null;
  }

  if (isAuthPage && hasAuthCookie) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (!isAuthPage && !hasAuthCookie) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    // Preserva a URL original para redirecionar o usuario de volta apos login.
    redirectUrl.search = `?next=${encodeURIComponent(`${pathname}${search}`)}`;
    return NextResponse.redirect(redirectUrl);
  }

  return null;
}
