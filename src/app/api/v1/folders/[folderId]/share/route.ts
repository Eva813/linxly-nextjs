import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { Resend } from "resend";

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
    const { db } = await connectToDatabase();
    const folder = await db.collection('folders').findOne({
      _id: new ObjectId(folderId),
      userId: new ObjectId(userId),
    });
    if (!folder) {
      return NextResponse.json(
        { message: 'folder not found or unauthorized' },
        { status: 404 }
      );
    }

    const now = new Date();
    const shareItems = list.map((email) => ({
      _id: new ObjectId(),
      email,
      permission,
      status: 'pending',
      invitedAt: now,
    }));

    await db.collection('folders').updateOne(
      { _id: new ObjectId(folderId) },
      { $push: { shares: { $each: shareItems } }, $set: { updatedAt: now } }
    );

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
                subject: `Invitation to share folder ${folder.name}`,
                html: `<p>You have been invited to collaborate on folder <strong>${folder.name}</strong>.</p><p><a href="${inviteLink}">Click here to accept the invitation</a></p>`,
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
    const { db } = await connectToDatabase();
    // 驗證擁有權
    const folder = await db.collection('folders').findOne({
      _id: new ObjectId(folderId),
      userId: new ObjectId(userId),
    });
    if (!folder) {
      return NextResponse.json(
        { message: 'folder not found or unauthorized' },
        { status: 404 }
      );
    }
    // 回傳 shares 陣列
    const shares = folder.shares || [];
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
    const { db } = await connectToDatabase();
    // 從 shares 陣列移除對應 _id 的項目
    const result = await db.collection('folders').updateOne(
      { _id: new ObjectId(folderId), userId: new ObjectId(userId) },
      {
        $pull: { shares: { _id: new ObjectId(shareId) } },
        $set: { updatedAt: new Date() },
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ message: 'share not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'share deleted' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'unknown error';
    return NextResponse.json(
      { message: 'server error', error: errorMessage },
      { status: 500 }
    );
  }
}