// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPreflight = request.method === "OPTIONS";

  // 不攔截 NextAuth 內建 API
  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  // 針對前端 login 頁面：已登入者不准再訪問 /login，直接跳回首頁
  if (pathname === "/login") {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === "production",
    });
    if (token) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Public API 路徑（不需 token）
  const publicPaths = [
    "/api/v1/auth/login",
    "/api/v1/auth/signup",
    "/api/health",
  ];

  if (publicPaths.includes(pathname) || isPreflight) {
    return NextResponse.json({}, { headers: CORS_HEADERS });
  }

  // 處理所有預檢請求 CORS
  if (isPreflight) {
    return NextResponse.json({}, { headers: CORS_HEADERS });
  }

  // 其餘路由皆需驗證 token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
  }

  // 剔除掉 request headers 中的 x-user-id，避免重複傳送
  const downstreamHeaders = new Headers();
  for (const [key, value] of request.headers) {
    if (key.toLowerCase() !== "x-user-id") {
      downstreamHeaders.set(key, value);
    }
  }
  downstreamHeaders.set("x-user-id", token.sub as string);

  // 將 token 的資訊掛在 request headers 上，方便後端取得
  const response = NextResponse.next({
    request: { headers: downstreamHeaders },
  });
  // 設定 CORS headers
  Object.entries(CORS_HEADERS).forEach(([k, v]) =>
    response.headers.set(k, v)
  );

  return response;
}

export const config = {
  // 加入 /login 的攔截，才能在 Edge Middleware 做判斷
  matcher: [
    "/login",
    "/api/v1/:path*",
    "/api/health",
  ],
};
