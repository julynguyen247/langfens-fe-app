import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/"];

function isAsset(pathname: string) {
  return /\.(png|jpg|jpeg|gif|svg|webp|ico|bmp|avif|mp4|webm|css|js|map|txt|xml|json|woff|woff2|ttf|otf|eot)$/i.test(
    pathname
  );
}

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")))
    return true;
  if (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  )
    return true;
  return false;
}

export function middleware(req: NextRequest) {
  // const { pathname } = req.nextUrl;
  // if (isAsset(pathname)) return NextResponse.next();
  // const hasSession = Boolean(req.cookies.get('session_token')?.value);
  // if (isPublic(pathname)) {
  //   if (hasSession && pathname.startsWith('/auth')) {
  //     const url = req.nextUrl.clone();
  //     url.pathname = '/home';
  //     return NextResponse.redirect(url);
  //   }
  //   return NextResponse.next();
  // }
  // if (!hasSession) {
  //   const url = req.nextUrl.clone();
  //   url.pathname = '/auth/login';
  //   return NextResponse.redirect(url);
  // }
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|robots.txt|sitemap.xml).*)"],
};
