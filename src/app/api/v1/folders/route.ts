import { NextResponse } from 'next/server';
import { adminDb } from '@/server/db/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { 
  groupPromptsByFolderId, 
  formatPromptsForResponse 
} from '@/server/utils/promptUtils';

export async function GET(req: Request) {
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // 獲取當前選中的 promptSpaceId
    const url = new URL(req.url);
    const promptSpaceId = url.searchParams.get('promptSpaceId');

    if (!promptSpaceId) {
      return NextResponse.json({ message: 'promptSpaceId required' }, { status: 400 });
    }

    // Check if user has access to this space (owner or shared)
    let spaceOwnerId = userId; // Assume user is owner first
    
    // Check if user is the owner of the space
    const spaceDoc = await adminDb
      .collection('prompt_spaces')
      .doc(promptSpaceId)
      .get();
    if (spaceDoc.exists) {
      const spaceData = spaceDoc.data();
      if (spaceData?.userId === userId) {
        // User is the owner, use their userId
        spaceOwnerId = userId;
      } else {
        // User might be a shared user, check if they have access (只查詢需要的欄位)
        const shareQuery = await adminDb
          .collection('space_shares')
          .where('promptSpaceId', '==', promptSpaceId)
          .where('sharedWithUserId', '==', userId)
          .limit(1)
          .select('promptSpaceId')
          .get();
        
        if (shareQuery.empty) {
          return NextResponse.json({ message: 'Access denied' }, { status: 403 });
        }
        
        // User has shared access, use space owner's userId to fetch folders
        spaceOwnerId = spaceData?.userId || userId;
      }
    }

    // 直接查詢特定 promptSpaceId，減少不必要的資料傳輸
    // 使用 select() 只查詢需要的欄位
    console.log(`API: Fetching folders and prompts for space ${promptSpaceId}, user ${userId}, spaceOwner ${spaceOwnerId}`);
    
    const [foldersSnapshot, promptsSnapshot] = await Promise.all([
      adminDb
        .collection('folders')
        .where('promptSpaceId', '==', promptSpaceId)
        .where('userId', '==', spaceOwnerId)
        .orderBy('createdAt', 'asc')
        .select('name', 'description', 'createdAt', 'updatedAt')
        .get(),
      adminDb
        .collection('prompts')
        .where('promptSpaceId', '==', promptSpaceId)
        .where('userId', '==', spaceOwnerId)
        .select('name', 'content', 'contentJSON', 'shortcut', 'seqNo', 'folderId', 'createdAt')
        .get()
    ]);

    console.log(`API: Found ${foldersSnapshot.docs.length} folders and ${promptsSnapshot.docs.length} prompts`);

    // 資料已經是精準查詢的結果，不需要過濾
    const filteredFolders = foldersSnapshot.docs;
    const filteredPrompts = promptsSnapshot.docs;

    // 將 prompts 按 folderId 分組
    const promptsMap = groupPromptsByFolderId(filteredPrompts);
    
    console.log(`API: Prompts grouped by folder:`, 
      Array.from(promptsMap.entries()).map(([folderId, prompts]) => ({
        folderId,
        promptCount: prompts.length,
        promptNames: prompts.map(p => p.name)
      }))
    );

    // 處理每個資料夾並組合資料
    const result = await Promise.all(filteredFolders.map(async (folderDoc) => {
      const folder = folderDoc.data();
      const folderId = folderDoc.id;

      // 從分組的 Map 中獲取該資料夾的 prompts
      const folderPrompts = promptsMap.get(folderId) || [];
      
      console.log(`API: Processing folder ${folderId} (${folder.name}): found ${folderPrompts.length} prompts`);
      
      // 如果沒有找到 prompts，嘗試直接查詢該 folderId（可能是 promptSpaceId 不一致的問題）
      let finalPrompts = folderPrompts;
      if (folderPrompts.length === 0) {
        console.log(`API: No prompts found for folder ${folderId}, trying direct query...`);
        const directQuery = await adminDb
          .collection('prompts')
          .where('folderId', '==', folderId)
          .where('userId', '==', spaceOwnerId)
          .get();
        
        if (!directQuery.empty) {
          console.log(`API: Direct query found ${directQuery.docs.length} prompts for folder ${folderId}`);
          const directPrompts = directQuery.docs.map(doc => {
            const prompt = doc.data();
            return {
              id: doc.id,
              name: prompt.name,
              content: prompt.content,
              contentJSON: prompt.contentJSON,
              shortcut: prompt.shortcut,
              seqNo: prompt.seqNo,
              createdAt: prompt.createdAt,
              folderId: prompt.folderId,
              userId: prompt.userId
            };
          });
          finalPrompts = directPrompts;
        }
      }

      // 直接排序 prompts（所有 prompts 現在都有 seqNo）
      const sortedPrompts = finalPrompts.sort((a, b) => (a.seqNo || 0) - (b.seqNo || 0));

      // 格式化程式碼片段資料
      const formattedPrompts = formatPromptsForResponse(sortedPrompts);

      return {
        id: folderId,
        name: folder.name,
        description: folder.description || '',
        prompts: formattedPrompts
      };
    }));

    return NextResponse.json(result);

  } catch (error: unknown) {
    console.error("GET folders 錯誤:", error);
    const errorMessage = error instanceof Error ? error.message : 'unknown error';
    return NextResponse.json(
      { message: 'server error', error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json();
    if (!body.name) {
      return NextResponse.json(
        { message: 'name required' },
        { status: 400 }
      );
    }

    if (!body.promptSpaceId) {
      return NextResponse.json(
        { message: 'promptSpaceId required' },
        { status: 400 }
      );
    }

    // Validate promptSpaceId format (basic check)
    if (typeof body.promptSpaceId !== 'string' || body.promptSpaceId.trim().length === 0) {
      return NextResponse.json(
        { message: 'Invalid promptSpaceId format' },
        { status: 400 }
      );
    }

    // Check if user has edit permission for this space
    const spaceDoc = await adminDb.collection('prompt_spaces').doc(body.promptSpaceId).get();
    if (!spaceDoc.exists) {
      return NextResponse.json({ message: 'Space not found' }, { status: 404 });
    }

    const spaceData = spaceDoc.data();
    let canEdit = false;
    let folderOwnerId = userId;

    if (spaceData?.userId === userId) {
      // User is the owner
      canEdit = true;
      folderOwnerId = userId;
    } else {
      // Check if user has shared access with edit permission
      const shareQuery = await adminDb
        .collection('space_shares')
        .where('promptSpaceId', '==', body.promptSpaceId)
        .where('sharedWithUserId', '==', userId)
        .limit(1)
        .get();
      
      if (!shareQuery.empty) {
        const shareData = shareQuery.docs[0].data();
        if (shareData.permission === 'edit') {
          canEdit = true;
          // For shared spaces, use space owner's userId for folders
          folderOwnerId = spaceData?.userId || userId;
        }
      }
    }

    if (!canEdit) {
      return NextResponse.json({ message: 'Insufficient permissions' }, { status: 403 });
    }

    const now = FieldValue.serverTimestamp();

    const folderData = {
      userId: folderOwnerId, // Use space owner's userId
      name: body.name,
      description: body.description || '',
      promptSpaceId: body.promptSpaceId,
      createdAt: now,
      updatedAt: now
    };

    // 使用 Admin SDK 的方式建立文件
    const folderRef = await adminDb.collection('folders').add(folderData);

    const created = {
      id: folderRef.id,
      name: body.name,
      description: body.description || '',
      prompts: [] // 新資料夾初始沒有 prompts
    };

    return NextResponse.json(created, { status: 201 });
  } catch (error: unknown) {
    console.error("POST folder 錯誤:", error);
    const errorMessage = error instanceof Error ? error.message : 'unknown error';
    return NextResponse.json(
      { message: 'server error', error: errorMessage },
      { status: 500 }
    );
  }
}