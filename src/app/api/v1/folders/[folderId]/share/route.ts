import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { Resend } from "resend";
import { FieldValue } from 'firebase-admin/firestore';

// 定義分享項目的型別
interface ShareItem {
  id: string;
  email: string;
  permission: string;
  status: 'pending' | 'accepted' | 'declined';
  invitedAt: Date;
  userId?: string;
}

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

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



    const { emails, permission } = await req.json();
    // 支援字串陣列 or 逗號分隔字串
    const list = Array.isArray(emails)
      ? emails.map(e => e.trim()).filter(e => e)
      : (emails as string).split(',').map(e => e.trim()).filter(e => e);
    if (!list.length || !permission) {
      return NextResponse.json(
        { message: 'emails and permission required' },
        { status: 400 }
      );
    }

  try {
    // 驗證資料夾是否存在且用戶有權限
    const folderDoc = await adminDb.collection('folders').doc(folderId).get();
    if (!folderDoc.exists) {
      return NextResponse.json(
        { message: 'folder not found' },
        { status: 404 }
      );
    }

    const folderData = folderDoc.data();
    if (folderData?.userId !== userId) {
      return NextResponse.json(
        { message: 'unauthorized' },
        { status: 403 }
      );
    }

    const now = new Date();
    const shareItems = list.map((email) => ({
      id: adminDb.collection('folders').doc().id, // 產生唯一 ID
      email,
      permission,
      status: 'pending',
      invitedAt: now,
    }));

    // 更新資料夾，加入分享項目
    await adminDb.collection('folders').doc(folderId).update({
      shares: FieldValue.arrayUnion(...shareItems),
      updatedAt: now,
    });

    // 發送邀請信
    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not set');
    } else {
        const resend = new Resend(RESEND_API_KEY); 
        for (const item of shareItems) {
            const inviteLink = `${APP_URL}/sign-up?inviteFolder=${folderId}&email=${encodeURIComponent(item.email)}`;
            try {
              await resend.emails.send({
                from: FROM_EMAIL,
                // 測試用，使用寄送到自己的信箱
                // to: [item.email],
                to: ["as45986@gmail.com"],
                subject: `Invitation to share folder ${folderData.name}`,
                html: `<p>You have been invited to collaborate on folder <strong>${folderData.name}</strong>.</p><p><a href="${inviteLink}">Click here to accept the invitation</a></p>`,
              });
            }
            catch (error) {
              console.error(`Failed to send email to ${item.email}:`, error);
            }
          }
        }
    return NextResponse.json({ message: 'Invitations sent' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'unknown error';
    return NextResponse.json(
      { message: 'server error', error: errorMessage },
      { status: 500 }
    );
  }
}




export async function GET(
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
    // 取得資料夾資料
    const folderDoc = await adminDb.collection('folders').doc(folderId).get();
    if (!folderDoc.exists) {
      return NextResponse.json(
        { message: 'folder not found' },
        { status: 404 }
      );
    }

    const folderData = folderDoc.data();
    
    // 驗證擁有權或分享權限
    // 資料夾擁有者 或 被接受分享的使用者都能取得 shares 資訊
    const isOwner = folderData?.userId === userId;
    const hasShareAccess = folderData?.shares?.some((share: ShareItem) => 
      share.userId === userId && share.status === 'accepted'
    );

    if (!isOwner && !hasShareAccess) {
      return NextResponse.json(
        { message: 'unauthorized' },
        { status: 403 }
      );
    }

    // 回傳 shares 陣列
    const shares = folderData?.shares || [];
    return NextResponse.json(shares);
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json(
      { message: 'server error', error: err instanceof Error ? err.message : 'unknown error' },
      { status: 500 }
    );
  }
}


export async function DELETE(
  req: Request,
  { params }: { params: { folderId: string } }
) {
  // 取得並驗證 userId
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // 驗證 folderId
  const folderId = params.folderId;
  if (!folderId) {
    return NextResponse.json({ message: 'folderId required' }, { status: 400 });
  }

  // 解析 shareId
  const { shareId } = await req.json();
  if (!shareId) {
    return NextResponse.json({ message: 'shareId required' }, { status: 400 });
  }

  try {
    // 取得資料夾資料
    const folderDoc = await adminDb.collection('folders').doc(folderId).get();
    if (!folderDoc.exists) {
      return NextResponse.json({ message: 'folder not found' }, { status: 404 });
    }

    const folderData = folderDoc.data();
    
    // 驗證是否為資料夾擁有者
    if (folderData?.userId !== userId) {
      return NextResponse.json({ message: 'unauthorized' }, { status: 403 });
    }

    // 找出要刪除的分享項目
    const shares = folderData?.shares || [];
    const shareToRemove = shares.find((share: ShareItem) => share.id === shareId);
    
    if (!shareToRemove) {
      return NextResponse.json({ message: 'share not found' }, { status: 404 });
    }

    // 從 shares 陣列移除對應項目
    await adminDb.collection('folders').doc(folderId).update({
      shares: FieldValue.arrayRemove(shareToRemove),
      updatedAt: new Date(),
    });

    return NextResponse.json({ message: 'share deleted' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'unknown error';
    return NextResponse.json(
      { message: 'server error', error: errorMessage },
      { status: 500 }
    );
  }
}