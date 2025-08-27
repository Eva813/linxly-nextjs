import { NextResponse } from 'next/server';
import { adminDb } from '@/server/db/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { getMaxSeqNoInTransaction } from '@/server/utils/promptUtils';


function sanitizePageTitle(title: string): string {
  return title
    .trim()
    .replace(/[<>"'`]/g, '')
    .slice(0, 200);
}

function sanitizeAndConvertToJSON(input: string): object {
  // 清理並提取純文字
  const cleanText = input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/<[^>]*>/g, '') // 移除所有 HTML，保留純文字
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 10000);
  
  // 轉換為標準 TipTap JSON 格式
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: cleanText
          }
        ]
      }
    ]
  };
}

export async function POST(req: Request) {
  const userId = req.headers.get('x-user-id');
  
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { content, pageTitle, pageUrl, folderId } = await req.json();

    // 驗證必要參數
    if (!content || !pageTitle || !pageUrl) {
      return NextResponse.json(
        { message: 'content, pageTitle and pageUrl required' },
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

    // 創建 JSON 格式內容
    const contentJSON = sanitizeAndConvertToJSON(content);
    const cleanTitle = sanitizePageTitle(pageTitle);

    // 如果沒有指定 folderId，需要找到用戶的第一個 folder
    let targetFolderId = folderId;
    if (!targetFolderId) {
      const foldersSnapshot = await adminDb
        .collection('folders')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'asc')
        .limit(1)
        .get();

      if (foldersSnapshot.empty) {
        return NextResponse.json(
          { message: 'no folder found for user' },
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

    // 從 folder 獲取正確的 promptSpaceId，確保資料一致性
    const promptSpaceId = folderData.promptSpaceId;
    if (!promptSpaceId) {
      return NextResponse.json(
        { message: 'folder does not have a valid promptSpaceId' },
        { status: 400 }
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
        content: '', // 新格式不使用 HTML
        contentJSON: contentJSON, // 統一使用 JSON 格式
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
      content: '',
      contentJSON: contentJSON,
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