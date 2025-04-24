import { NextRequest, NextResponse } from 'next/server'

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

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin') ?? ''
  const isAllowedOrigin = allowedOrigins.includes(origin)
  // 判斷是否為 Preflight（OPTIONS）請求
  const isPreflight = request.method === 'OPTIONS'

  // Preflight 請求
  if (isPreflight) {
    const preflightHeaders = {
      ...(isAllowedOrigin && { 'Access-Control-Allow-Origin': origin }),
      ...CORS_HEADERS,
    }
    return NextResponse.json({}, { headers: preflightHeaders })
  }

  // 正常請求
  const res = NextResponse.next()
  if (isAllowedOrigin) {
    res.headers.set('Access-Control-Allow-Origin', origin)
  }
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    res.headers.set(key, value)
  })
  return res
}

// 只對 /api 路徑生效
export const config = { matcher: '/api/:path*' }