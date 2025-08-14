import { NextResponse } from 'next/server';
import { adminDb } from '@/server/db/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { getMaxSeqNoInTransaction } from '@/server/utils/promptUtils';

// 輸入清理函數
function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>"'`]/g, '') // 移除潛在危險字元
    .replace(/\s+/g, ' ')
    .slice(0, 10000); // 限制長度
}

function sanitizePageTitle(title: string): string {
  return title
    .trim()
    .replace(/[<>"'`]/g, '')
    .slice(0, 200);
}

function createPrefillContent(content: string): string {
  const cleanContent = sanitizeInput(content);
  return `${cleanContent}`;
}

export async function POST(req: Request) {
  const userId = req.headers.get('x-user-id');
  
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { content, pageTitle, pageUrl, promptSpaceId, folderId } = await req.json();

    // 驗證必要參數
    if (!content || !pageTitle || !pageUrl) {
      return NextResponse.json(
        { message: 'content, pageTitle and pageUrl required' },
        { status: 400 }
      );
    }

    if (!promptSpaceId) {
      return NextResponse.json(
        { message: 'promptSpaceId required' },
        { status: 400 }
      );
    }

    // 驗證 URL 格式
    try {
      new URL(pageUrl);
    } catch {
      return NextResponse.json(
        { message: 'invalid pageUrl format' },
        { status: 400 }
      );
    }

    // 創建預填內容
    const prefillContent = createPrefillContent(content);
    const cleanTitle = sanitizePageTitle(pageTitle);

    // 如果沒有指定 folderId，需要找到該 space 的第一個 folder
    let targetFolderId = folderId;
    if (!targetFolderId) {
      const foldersSnapshot = await adminDb
        .collection('folders')
        .where('userId', '==', userId)
        .where('promptSpaceId', '==', promptSpaceId)
        .orderBy('createdAt', 'asc')
        .limit(1)
        .get();

      if (foldersSnapshot.empty) {
        return NextResponse.json(
          { message: 'no folder found in the specified space' },
          { status: 404 }
        );
      }

      targetFolderId = foldersSnapshot.docs[0].id;
    }

    // 檢查 folder 是否存在且用戶有權限
    const folderDoc = await adminDb
      .collection('folders')
      .doc(targetFolderId)
      .get();

    if (!folderDoc.exists) {
      return NextResponse.json(
        { message: 'folder not found' },
        { status: 404 }
      );
    }

    const folderData = folderDoc.data();
    if (folderData?.userId !== userId) {
      return NextResponse.json(
        { message: 'access denied' },
        { status: 403 }
      );
    }

    // 使用交易確保 seqNo 生成和 prompt 創建的原子性，避免競爭條件
    const result = await adminDb.runTransaction(async (transaction) => {
      // 在交易中獲取最大 seqNo
      const maxSeqNo = await getMaxSeqNoInTransaction(transaction, targetFolderId, userId);
      const nextSeqNo = maxSeqNo + 1;

      // 產生唯一 shortcut，格式為 /webPrompt-<seqNo>
      const shortcut = `/webPrompt-${nextSeqNo}`;

      const promptData = {
        folderId: targetFolderId,
        userId,
        name: cleanTitle,
        content: prefillContent,
        shortcut, // shortcut 會依照 seqNo 順序遞增，確保唯一性
        promptSpaceId,
        seqNo: nextSeqNo,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };

      // 在交易中創建 prompt 文件
      const newDocRef = adminDb.collection('prompts').doc();
      transaction.set(newDocRef, promptData);
      
      // 回傳需要的資料
      return {
        docRef: newDocRef,
        shortcut,
        seqNo: nextSeqNo
      };
    });

    const created = {
      id: result.docRef.id,
      name: cleanTitle,
      content: prefillContent,
      shortcut: result.shortcut,
      seqNo: result.seqNo
    };

    return NextResponse.json(created, { status: 201 });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'unknown error';

    // 如果是特定的驗證錯誤，返回更具體的錯誤信息
    if (errorMessage.includes('Failed to write document to database')) {
      return NextResponse.json(
        { message: 'Database write verification failed', error: errorMessage },
        { status: 500 }
      );
    }

    if (errorMessage.includes('permission')) {
      return NextResponse.json(
        { message: 'Permission denied', error: errorMessage },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { message: 'server error', error: errorMessage },
      { status: 500 }
    );
  }
}

// 支援 OPTIONS 請求（CORS 預檢）
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-user-id',
    },
  });
}