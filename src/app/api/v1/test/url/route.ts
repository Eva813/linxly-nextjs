import { NextResponse } from 'next/server';
import { getBaseUrl } from '@/server/utils/urlUtils';

// GET /api/v1/test/url
// 測試 URL 生成功能
export async function GET(req: Request) {
  try {
    const baseUrl = getBaseUrl(req);
    
    // 取得所有相關標頭資訊
    const headers = {
      host: req.headers.get('host'),
      'x-forwarded-proto': req.headers.get('x-forwarded-proto'),
      'x-forwarded-ssl': req.headers.get('x-forwarded-ssl'),
      'user-agent': req.headers.get('user-agent'),
    };

    const environmentInfo = {
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      VERCEL_URL: process.env.VERCEL_URL,
      NODE_ENV: process.env.NODE_ENV,
    };

    return NextResponse.json({
      success: true,
      generatedBaseUrl: baseUrl,
      headers,
      environmentInfo,
      sampleInviteLink: `${baseUrl}/invite/sample-share-id`,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error in URL test:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
