import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

// 取得待接受分享邀請列表
export async function GET(req: Request) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 取得使用者 email
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    const userData = userDoc.data();
    const email = userData?.email;
    
    if (!email) {
      return NextResponse.json({ message: 'User email not found' }, { status: 404 });
    }

    // 查詢所有對此 user email 有 pending 分享的 folder
    const foldersSnapshot = await adminDb
      .collection('folders')
      .where('shares', 'array-contains', { email, status: 'pending' })
      .get();

    // 取出 owner email
    const results = await Promise.all(
      foldersSnapshot.docs.map(async (doc) => {
        const folderData = doc.data();
        // 取得資料夾擁有者的 email，folder 中的 userId 是擁有者的 id
        const ownerDoc = await adminDb.collection('users').doc(folderData.userId).get();
        const ownerData = ownerDoc.data();
        
        return {
          folderId: doc.id,
          folderName: folderData.name,
          ownerEmail: ownerData?.email || ''
        };
      })
    );

    return NextResponse.json(results);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'unknown error';
    return NextResponse.json({ message: 'server error', error: msg }, { status: 500 });
  }
}
