import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// 取得待接受分享邀請列表
export async function GET(req: Request) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { db } = await connectToDatabase();
    // 取得使用者 email
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user || !user.email) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    const email = user.email;
    // 查詢所有對此 user email 有 pending 分享的 folder
    const folders = await db
      .collection('folders')
      .find({ 'shares.email': email, 'shares.status': 'pending' })
      .toArray();

    // 取出 owner email
    const results = await Promise.all(
      folders.map(async (f) => {
        const owner = await db.collection('users').findOne({ _id: new ObjectId(f.ownerId) });
        return {
          folderId: f._id.toString(),
          folderName: f.name,
          ownerEmail: owner?.email || ''
        };
      })
    );

    return NextResponse.json(results);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'unknown error';
    return NextResponse.json({ message: 'server error', error: msg }, { status: 500 });
  }
}
