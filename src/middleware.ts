// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

const CORS_HEADERS = {
  'Access-Control-Allow-Methods':  'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers':  'Content-Type,Authorization',
}

// 全域放行所有 origin
const WILDCARD = { 'Access-Control-Allow-Origin': '*' }

export function middleware(request: NextRequest) {
  const isPreflight = request.method === 'OPTIONS'

  if (isPreflight) {
    // OPTIONS 回應直接帶 *
    return NextResponse.json({}, {
      status: 204,
      headers: {
        ...WILDCARD,
        ...CORS_HEADERS,
      },
    })
  }

  // 正常請求：無條件設 '*'
  const res = NextResponse.next()
  res.headers.set('Access-Control-Allow-Origin', '*')
  Object.entries(CORS_HEADERS).forEach(([k, v]) => {
    res.headers.set(k, v)
  })
  return res
}

// 只對 /api 路徑生效
export const config = { matcher: '/api/:path*' }
