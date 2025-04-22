// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    // 發一個 ping 命令，確保連線正常
    await db.command({ ping: 1 });
    return NextResponse.json({ message: 'MongoDB 連線成功 ✅' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'unknow error';
    return NextResponse.json(
      { message: 'MongoDB 連線失敗 ❌', error: errorMessage },
      { status: 500 }
    );
  }
}
