import { NextResponse } from 'next/server';
import { adminDb } from '@/server/db/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { getMaxSeqNo } from '@/server/utils/promptUtils';

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

function createPrefillContent(content: string, pageTitle: string, pageUrl: string): string {
  const cleanContent = sanitizeInput(content);
  const cleanTitle = sanitizePageTitle(pageTitle);
  
  const sourceInfo = `---
  來源：${cleanTitle}
  網址：${pageUrl}`;

  return `${cleanContent}\n\n${sourceInfo}`;
}

export async function POST(req: Request) {
  const userId = req.headers.get('x-user-id');
  
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { content, pageTitle, pageUrl, promptSpaceId, folderId } = await req.json();
    console.log('[Extension API] Request body parsed:', {
      contentLength: content?.length,
      pageTitle: pageTitle?.substring(0, 50) + '...',
      pageUrl,
      promptSpaceId,
      folderId
    });

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
    const prefillContent = createPrefillContent(content, pageTitle, pageUrl);
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

    // 獲取下一個 seqNo
    const maxSeqNo = await getMaxSeqNo(targetFolderId, userId);
    const nextSeqNo = maxSeqNo + 1;

    // 創建 prompt
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

    console.log('[Extension API] Preparing to write prompt data:', {
      folderId: promptData.folderId,
      userId: promptData.userId,
      nameLength: promptData.name.length,
      contentLength: promptData.content.length,
      promptSpaceId: promptData.promptSpaceId,
      seqNo: promptData.seqNo
    });

    const docRef = await adminDb.collection('prompts').add(promptData);
    
    // 等待一小段時間確保寫入完成
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 第一次驗證：直接讀取
    let verifyDoc = await adminDb.collection('prompts').doc(docRef.id).get();
    console.log('[Extension API] First verification attempt:', {
      exists: verifyDoc.exists,
      id: docRef.id
    });
    
    // 如果第一次失敗，等待並重試
    if (!verifyDoc.exists) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      verifyDoc = await adminDb.collection('prompts').doc(docRef.id).get();
      console.log('[Extension API] Second verification attempt:', {
        exists: verifyDoc.exists,
        id: docRef.id
      });
    }
    
    // 如果還是失敗，嘗試查詢方式驗證
    if (!verifyDoc.exists) {
      console.log('[Extension API] Direct read failed, trying query verification...');
      const querySnapshot = await adminDb.collection('prompts')
        .where('folderId', '==', targetFolderId)
        .where('userId', '==', userId)
        .where('seqNo', '==', nextSeqNo)
        .limit(1)
        .get();
      
      console.log('[Extension API] Query verification result:', {
        empty: querySnapshot.empty,
        size: querySnapshot.size
      });
      
      if (querySnapshot.empty) {
        console.error('[Extension API] CRITICAL: Document was not written to Firestore despite success response!');
        console.error('[Extension API] Write operation details:', {
          docRefId: docRef.id,
          targetFolderId,
          userId,
          nextSeqNo,
          promptSpaceId
        });
        throw new Error('Failed to write document to database - verification failed');
      } else {
        // 找到了文檔，但 ID 不匹配
        const actualDoc = querySnapshot.docs[0];
        // 使用實際的文檔作為驗證結果
        verifyDoc = actualDoc;
      }
    }
    const finalDocId = verifyDoc.exists ? verifyDoc.id : docRef.id;

    const created = {
      id: finalDocId,
      name: cleanTitle,
      content: prefillContent,
      shortcut,
      seqNo: nextSeqNo
    };

    return NextResponse.json(created, { status: 201 });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'unknown error';
    const errorStack = error instanceof Error ? error.stack : 'no stack trace';
    
    console.error('[Extension API] Error creating prompt:', {
      error,
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString()
    });

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