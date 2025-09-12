import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/server/db/firebase';
import { checkFolderAccess, getUserEmail } from '@/server/utils/folderAccess';

interface SharedFolderDetailResponse {
  id: string;
  name: string;
  description?: string;
  promptCount: number;
  sharedFrom: string;
  shareType: 'space' | 'additional' | 'public';
  permission: 'view' | 'edit';
  shareEmail?: string;
  prompts: {
    id: string;
    name: string;
    content: string;
    contentJSON: object | null;
    shortcut?: string;
  }[];
}

// GET - 獲取 shared folder 詳細資訊
export async function GET(
  request: NextRequest,
  { params }: { params: { folderId: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const { folderId } = params;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: User ID is required' },
        { status: 401 }
      );
    }

    // 1. 檢查用戶權限
    const accessCheck = await checkFolderAccess(userId, folderId);

    if (!accessCheck.permission) {
      return NextResponse.json(
        { error: 'Folder not found or access denied' },
        { status: 404 }
      );
    }

    // 2. 獲取 folder 基本資訊
    const folderDoc = await adminDb.collection('folders').doc(folderId).get();
    if (!folderDoc.exists) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    const folderData = folderDoc.data();

    // 3. 獲取分享資訊
    const sharedBy: { name?: string; email?: string; sharedDate: string } = {
      sharedDate:
        folderData?.createdAt?.toDate?.()?.toISOString() ||
        new Date().toISOString(),
    };

    // 獲取 folder owner 資訊
    if (folderData?.userId) {
      const ownerEmail = await getUserEmail(folderData.userId);
      sharedBy.email = ownerEmail || undefined;

      // 嘗試獲取 owner 名稱（從 users collection）
      const ownerDoc = await adminDb
        .collection('users')
        .doc(folderData.userId)
        .get();
      if (ownerDoc.exists) {
        const ownerData = ownerDoc.data();
        sharedBy.name = ownerData?.name || ownerData?.displayName || undefined;
      }
    }

    // 4. sharedFrom 標籤
    let sharedFromText = '';
    let shareEmail: string | undefined;

    // 優先顯示分享者姓名，其次是 email
    if (sharedBy.name) {
      sharedFromText = sharedBy.name;
      shareEmail = sharedBy.email;
    } else if (sharedBy.email) {
      sharedFromText = sharedBy.email;
      shareEmail = sharedBy.email;
    } else {
      // 如果都沒有，顯示根據分享類型的預設文字
      switch (accessCheck.source) {
        case 'space':
          sharedFromText = 'Space member';
          break;
        case 'additional':
          sharedFromText = 'Direct invitation';
          break;
        case 'public':
          sharedFromText = 'Public sharing';
          break;
        default:
          sharedFromText = 'Unknown source';
      }
    }

    // 5. 獲取 folder 內的 prompts
    const promptsQuery = await adminDb
      .collection('prompts')
      .where('folderId', '==', folderId)
      .select('name', 'content', 'contentJSON', 'shortcut')
      .orderBy('seqNo', 'asc')
      .get();

    const prompts = promptsQuery.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'Untitled Prompt',
        content: data.content || '',
        contentJSON: data.contentJSON || null,
        shortcut: data.shortcut,
      };
    });

    const response: SharedFolderDetailResponse = {
      id: folderId,
      name: folderData?.name || 'Untitled Folder',
      description: folderData?.description,
      promptCount: prompts.length,
      sharedFrom: sharedFromText,
      shareType: accessCheck.source as 'space' | 'additional' | 'public',
      permission: accessCheck.permission as 'view' | 'edit',
      shareEmail,
      prompts,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting shared folder details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
