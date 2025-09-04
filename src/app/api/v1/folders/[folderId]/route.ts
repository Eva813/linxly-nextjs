import { NextResponse } from 'next/server';
import { adminDb } from '@/server/db/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { 
  formatPromptsForResponse
} from '@/server/utils/promptUtils';
import type { PromptData } from '@/shared/types/prompt';

// Helper function to create standardized error responses
function createErrorResponse(message: string, status: number) {
  return NextResponse.json({ 
    success: false, 
    message, 
    timestamp: new Date().toISOString() 
  }, { status });
}

// Helper function to get folder with prompts (eliminates code duplication)
async function getFolderWithPrompts(folderId: string, userId: string) {
  try {
    // Parallel query optimization: fetch folder and prompts simultaneously
    const [folderDoc, promptsSnapshot] = await Promise.all([
      adminDb.collection('folders').doc(folderId).get(),
      adminDb.collection('prompts')
        .where('folderId', '==', folderId)
        .where('userId', '==', userId)
        .get()
    ]);

    // Check folder existence and ownership
    if (!folderDoc.exists || folderDoc.data()?.userId !== userId) {
      return null;
    }

    const folder = folderDoc.data()!;

    // Transform prompts to PromptData format
    const prompts: PromptData[] = promptsSnapshot.docs.map(doc => {
      const prompt = doc.data();
      return {
        id: doc.id,
        name: prompt.name,
        content: prompt.content,
        shortcut: prompt.shortcut,
        seqNo: prompt.seqNo,
        createdAt: prompt.createdAt,
        folderId: prompt.folderId,
        userId: prompt.userId
      };
    });

    // Sort prompts by sequence number
    const sortedPrompts = prompts.sort((a, b) => (a.seqNo || 0) - (b.seqNo || 0));
    
    return { folder, prompts: sortedPrompts };
  } catch (error) {
    console.error('Error in getFolderWithPrompts:', error);
    return null;
  }
}

export async function GET(
  req: Request,
  { params }: { params: { folderId: string } }
) {

  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return createErrorResponse('Unauthorized', 401);
  }

  const folderId = params.folderId;
  if (!folderId) {
    return createErrorResponse('folderId required', 400);
  }
  try {
    // Use the optimized helper function to get folder with prompts
    const folderData = await getFolderWithPrompts(folderId, userId);
    
    if (!folderData) {
      return createErrorResponse('Folder not found', 404);
    }

    const { folder, prompts } = folderData;

    // Format response data
    const formattedPrompts = formatPromptsForResponse(prompts);
    
    const result = {
      id: folderId,
      name: folder.name,
      description: folder.description || '',
      prompts: formattedPrompts
    };

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Firebase error details:", error);
    return createErrorResponse('Internal server error', 500);
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { folderId: string } }
) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return createErrorResponse('Unauthorized', 401);
  }

  const folderId = params.folderId;
  const { name, description } = await req.json();
  
  // Input validation for name
  if (!name || typeof name !== 'string') {
    return createErrorResponse('Name is required and must be a string', 400);
  }
  if (name.trim().length === 0) {
    return createErrorResponse('Name cannot be empty', 400);
  }
  if (name.length > 50) {
    return createErrorResponse('Name must be 50 characters or less', 400);
  }

  // Input validation for description
  if (description !== undefined && typeof description !== 'string') {
    return createErrorResponse('Description must be a string', 400);
  }
  if (description && description.length > 500) {
    return createErrorResponse('Description must be 500 characters or less', 400);
  }

  // Sanitize inputs
  const sanitizedName = name.trim();
  const sanitizedDescription = description ? description.trim() : '';
  try {
    // Check folder existence first
    const initialCheck = await getFolderWithPrompts(folderId, userId);
    if (!initialCheck) {
      return createErrorResponse('Folder not found', 404);
    }

    // Update folder information with sanitized inputs
    await adminDb.collection('folders').doc(folderId).update({
      name: sanitizedName,
      description: sanitizedDescription,
      updatedAt: FieldValue.serverTimestamp()
    });

    // Get updated folder data with prompts
    const updatedFolderData = await getFolderWithPrompts(folderId, userId);
    if (!updatedFolderData) {
      return createErrorResponse('Failed to retrieve updated folder data', 500);
    }

    const { prompts } = updatedFolderData;

    // Format response data
    const formattedPrompts = formatPromptsForResponse(prompts);

    const result = {
      id: folderId,
      name: sanitizedName,
      description: sanitizedDescription,
      prompts: formattedPrompts
    };

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Firebase error details:", error);
    return createErrorResponse('Internal server error', 500);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { folderId: string } }
) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return createErrorResponse('Unauthorized', 401);
  }

  const folderId = params.folderId;
  try {
    // 檢查資料夾是否存在
    const folderDoc = await adminDb
      .collection('folders')
      .doc(folderId)
      .get();

    if (!folderDoc.exists || folderDoc.data()?.userId !== userId) {
      return createErrorResponse('Folder not found', 404);
    }

    // 並行查詢該資料夾的 prompts 和 folder_shares（效能優化）
    const [promptsSnapshot, sharesSnapshot] = await Promise.all([
      adminDb
        .collection('prompts')
        .where('folderId', '==', folderId)
        .where('userId', '==', userId)
        .get(),
      adminDb
        .collection('folder_shares')
        .where('folderId', '==', folderId)
        .get()
    ]);

    // 使用批次處理進行原子性刪除
    const batch = adminDb.batch();

    // 添加刪除 prompts 的操作到批次處理中
    promptsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // 添加刪除 folder_shares 的操作到批次處理中（級聯刪除）
    sharesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // 添加刪除資料夾的操作到批次處理中
    batch.delete(adminDb.collection('folders').doc(folderId));

    // 執行批次處理
    await batch.commit();

    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    console.error("Firebase error details:", error);
    return createErrorResponse('Internal server error', 500);
  }
}