import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// 接受資料夾分享
export async function POST(
  req: Request,
  { params }: { params: { folderId: string } }
) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ message: '未授權' }, { status: 401 });
  }

  const folderId = params.folderId;
  if (!folderId) {
    return NextResponse.json({ message: '需要 folderId' }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();
    // 取得使用者 Email
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user || !user.email) {
      return NextResponse.json({ message: '使用者不存在' }, { status: 404 });
    }

    // 檢查是否存在待接受的分享邀請
    const filter = {
      _id: new ObjectId(folderId),
      'shares.email': user.email,
      'shares.status': 'pending'
    };
    const update = {
      $set: {
        'shares.$.status': 'accepted',
        'shares.$.acceptedAt': new Date(),
        'shares.$.userId': new ObjectId(userId)
      }
    };
    const result = await db.collection('folders').updateOne(filter, update);

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: '找不到邀請或已接受' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: '已接受分享' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '未知錯誤';
    return NextResponse.json(
      { message: '伺服器錯誤', error: errorMessage },
      { status: 500 }
    );
  }
}
