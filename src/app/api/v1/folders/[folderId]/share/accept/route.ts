import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

// 定義分享項目的型別
interface ShareItem {
  id: string;
  email: string;
  permission: string;
  status: 'pending' | 'accepted' | 'declined';
  invitedAt: Date;
  userId?: string;
  acceptedAt?: Date;
}

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
    // 取得使用者 Email
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    const userData = userDoc.data();
    const email = userData?.email;
    
    if (!email) {
      return NextResponse.json({ message: 'User email not found' }, { status: 404 });
    }

    // 取得資料夾資料
    const folderDoc = await adminDb.collection('folders').doc(folderId).get();
    if (!folderDoc.exists) {
      return NextResponse.json({ message: 'Folder not found' }, { status: 404 });
    }

    const folderData = folderDoc.data();
    const shares = folderData?.shares || [];

    // 找到對應的分享項目
    const shareIndex = shares.findIndex((share: ShareItem) => 
      share.email === email && share.status === 'pending'
    );

    if (shareIndex === -1) {
      return NextResponse.json(
        { message: 'Invitation not found or already accepted' },
        { status: 404 }
      );
    }

    // 更新分享項目狀態
    const updatedShare = {
      ...shares[shareIndex],
      status: 'accepted' as const,
      acceptedAt: new Date(),
      userId: userId
    };

    // 建立新的 shares 陣列
    const updatedShares = [...shares];
    updatedShares[shareIndex] = updatedShare;

    // 更新資料庫
    await adminDb.collection('folders').doc(folderId).update({
      shares: updatedShares,
      updatedAt: new Date()
    });

    return NextResponse.json({ message: 'Share accepted' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { message: 'Server error', error: errorMessage },
      { status: 500 }
    );
  }
}
