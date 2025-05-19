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
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const folderId = params.folderId;
  if (!folderId) {
    return NextResponse.json({ message: 'folderId required' }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();
    // 取得使用者 Email
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user || !user.email) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
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
    console.log('userId:', userId, 'folderId:', folderId);
    const result = await db.collection('folders').updateOne(filter, update);
    console.log('update result:', result);

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: 'Invitation not found or already accepted' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Share accepted' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { message: 'Server error', error: errorMessage },
      { status: 500 }
    );
  }
}
