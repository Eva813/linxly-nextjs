import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};

export async function middleware(request: NextRequest) {
  // const origin = request.headers.get("origin") ?? "";
  const isPreflight = request.method === "OPTIONS";
  const path = request.nextUrl.pathname;

    // 排除 NextAuth 路徑
  if (path.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  // Public paths
  const publicPaths = ["/api/v1/auth/login", "/api/v1/auth/register", "/api/health"];
  if (publicPaths.includes(path)) {
    return NextResponse.next();
  }

  // Handle CORS for preflight requests
  if (isPreflight) {
    return NextResponse.json({}, { headers: CORS_HEADERS });
  }

  // Use next-auth's JWT token validation
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const res = NextResponse.next();
  res.headers.set("x-user-id", token.id as string);
  return res;
}

export const config = { 
  matcher: [
    // 只匹配 /api/ 開頭但不包含 /api/auth/ 的路徑
    "/api/v1/:path*",
    "/api/health"
  ]
};