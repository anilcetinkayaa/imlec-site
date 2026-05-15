import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const secureCookie =
    forwardedProto === "https" || request.nextUrl.protocol === "https:";
  const cookieNames = request.cookies.getAll().map((cookie) => cookie.name);
  const authCookieNames = cookieNames.filter((name) =>
    name.includes("authjs."),
  );

  console.log("[AUTH DEBUG] proxy path:", request.nextUrl.pathname);
  console.log("[AUTH DEBUG] proxy secureCookie:", secureCookie);
  console.log("[AUTH DEBUG] proxy auth cookies:", authCookieNames);

  let token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie,
  });

  if (!token) {
    token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      secureCookie: !secureCookie,
    });

    console.log(
      "[AUTH DEBUG] proxy fallback token found:",
      Boolean(token),
    );
  }

  console.log("[AUTH DEBUG] proxy token found:", Boolean(token));
  console.log("[AUTH DEBUG] proxy token user id:", token?.id ?? token?.sub);
  console.log("[AUTH DEBUG] proxy token email:", token?.email);

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (request.nextUrl.pathname.startsWith("/admin")) {
    const is2FARoute = request.nextUrl.pathname.startsWith("/admin/2fa");

    if (token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (!token.twoFactorRequired && !is2FARoute) {
      return NextResponse.redirect(new URL("/admin/2fa/setup", request.url));
    }

    if (
      token.twoFactorRequired &&
      token.twoFactorVerified !== true &&
      !is2FARoute
    ) {
      return NextResponse.redirect(new URL("/admin/2fa/verify", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
};
