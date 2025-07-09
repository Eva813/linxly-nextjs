import { NextResponse } from 'next/server';
import { adminDb } from '@/server/db/firebase';

/**
 * 資料遷移 API - 將現有的 folders 和 prompts 自動指派到 workspace-default (promptSpaceId = "1")
 * 這個 API 只會在開發/管理員模式下使用
 */
export async function POST(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { migrateData } = await req.json();
    if (!migrateData) {
      return NextResponse.json({ message: 'migrateData flag required' }, { status: 400 });
    }

    let migratedFolders = 0;
    let migratedPrompts = 0;

    // 1. 確保 workspace-default (promptSpaceId = "1") 存在
    const workspaceDefaultRef = adminDb.collection('promptSpaces').doc('1');
    const workspaceDefaultDoc = await workspaceDefaultRef.get();

    if (!workspaceDefaultDoc.exists) {
      await workspaceDefaultRef.set({
        userId: userId,
        name: 'workspace-default',
        createdAt: new Date(),
      });
    }

    // 2. 遷移沒有 promptSpaceId 的 folders
    const foldersWithoutSpaceId = await adminDb
      .collection('folders')
      .where('userId', '==', userId)
      .get();

    const folderBatch = adminDb.batch();
    foldersWithoutSpaceId.docs.forEach(doc => {
      const folderData = doc.data();
      if (!folderData.promptSpaceId) {
        folderBatch.update(doc.ref, { promptSpaceId: '1' });
        migratedFolders++;
      }
    });

    if (migratedFolders > 0) {
      await folderBatch.commit();
    }

    // 3. 遷移沒有 promptSpaceId 的 prompts
    const promptsWithoutSpaceId = await adminDb
      .collection('prompts')
      .where('userId', '==', userId)
      .get();

    const promptBatch = adminDb.batch();
    promptsWithoutSpaceId.docs.forEach(doc => {
      const promptData = doc.data();
      if (!promptData.promptSpaceId) {
        promptBatch.update(doc.ref, { promptSpaceId: '1' });
        migratedPrompts++;
      }
    });

    if (migratedPrompts > 0) {
      await promptBatch.commit();
    }

    return NextResponse.json({
      message: 'Migration completed successfully',
      migratedFolders,
      migratedPrompts,
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Migration 錯誤:', error);
    const errorMessage = error instanceof Error ? error.message : 'unknown error';
    return NextResponse.json(
      { message: 'migration error', error: errorMessage },
      { status: 500 }
    );
  }
}
