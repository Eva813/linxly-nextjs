import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose';

// 只放行這幾個 Origin：你的 Extension、你的前端網域（若還有其它）
const allowedOrigins = [
  'chrome-extension://fnklojfgggbcmcmldigpicflliiogoij',
  'arc-extension://fnklojfgggbcmcmldigpicflliiogoij',
  'https://chatgpt.com',
  'https://linxly-nextjs-git-feat-snippet-api-eva813s-projects.vercel.app',
  'https://linxly-nextjs.vercel.app/'
]

const CORS_HEADERS = {
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
}

export async function middleware(request: NextRequest) {
  const origin = request.headers.get('origin') ?? ''
  const isAllowedOrigin = allowedOrigins.includes(origin)
  const isPreflight = request.method === 'OPTIONS'
  const path = request.nextUrl.pathname

  // 白名單：login / register 只做 CORS 處理
  const publicPaths = ['/api/v1/auth/login', '/api/v1/auth/register', '/api/health']
  if (publicPaths.includes(path)) {
    const res = isPreflight
      ? NextResponse.json({}, { headers: { ...(isAllowedOrigin && { 'Access-Control-Allow-Origin': origin }), ...CORS_HEADERS } })
      : NextResponse.next()
    if (!isPreflight && isAllowedOrigin) {
      res.headers.set('Access-Control-Allow-Origin', origin)
      Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v))
    }
    return res
  }

  // Preflight 其餘路徑仍要 CORS
  if (isPreflight) {
    const preflightHeaders = {
      ...(isAllowedOrigin && { 'Access-Control-Allow-Origin': origin }),
      ...CORS_HEADERS,
    }
    return NextResponse.json({}, { headers: preflightHeaders })
  }

  // 2️⃣ 驗 JWT
  const authHeader = request.headers.get('authorization') || ''
  console.log('請求路徑:', path);
  console.log('身分驗證標頭:', authHeader ? `${authHeader.substring(0, 20)}...` : '無');

  if (!authHeader.startsWith('Bearer ')) {
      console.error('!!! JWT_SECRET is missing in environment variables !!!');
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  const token = authHeader.slice(7)
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secretKey);
    interface JwtPayload {
      sub: string;
      [key: string]: unknown;
    }
    const userId = (payload as JwtPayload).sub;
    const res = NextResponse.next()
    res.headers.set('x-user-id', userId)
  

    console.log('JWT 驗證成功 (jose)，使用者 ID:', payload.sub);

    if (isAllowedOrigin) {
      res.headers.set('Access-Control-Allow-Origin', origin)
    }
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v))
    return res
  } catch(err) {
          console.error('!!! JWT verification FAILED !!!'); // 先印簡單訊息
     console.error('Error details:', err); // 再印錯誤細節
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 })
  }
}

export const config = { matcher: '/api/:path*' }