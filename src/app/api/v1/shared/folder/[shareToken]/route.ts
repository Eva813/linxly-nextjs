import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/server/db/firebase';
import { SharedFolderResponse } from '@/shared/types/sharedFolder';

// 使用共用類型定義
type PublicFolderResponse = SharedFolderResponse;

// 錯誤回應模板
const ERROR_RESPONSES = {
  NOT_FOUND: {
    code: 'NOT_FOUND' as const,
    message: "This shared folder could not be found",
    cta: { text: "Create your own workspace", link: "/sign-up" }
  },
  INACTIVE: {
    code: 'INACTIVE' as const, 
    message: "This folder is no longer publicly shared",
    cta: { text: "Create your own workspace", link: "/sign-up" }
  },
  TEAM_ONLY: {
    code: 'TEAM_ONLY' as const,
    message: "This folder is only available to team members",
    cta: { text: "Create your own workspace", link: "/sign-up" }
  },
  FOLDER_DELETED: {
    code: 'FOLDER_DELETED' as const,
    message: "This folder has been deleted",
    cta: { text: "Create your own workspace", link: "/sign-up" }
  }
};

// 驗證 shareToken 並獲取分享資料
async function validateShareToken(shareToken: string) {
  try {
    const shareQuery = await adminDb
      .collection('folder_shares')
      .where('shareToken', '==', shareToken)
      .where('shareStatus', '==', 'public')
      .limit(1)
      .get();
      
    return shareQuery.empty ? null : shareQuery.docs[0];
  } catch (error) {
    console.error('Error validating share token:', error);
    return null;
  }
}

// 獲取 folder 資料
async function getFolderData(folderId: string) {
  try {
    const folderDoc = await adminDb.collection('folders').doc(folderId).get();
    return folderDoc.exists ? folderDoc.data() : null;
  } catch (error) {
    console.error('Error getting folder data:', error);
    return null;
  }
}

// 獲取 folder 內的 prompts
async function getFolderPrompts(folderId: string, userId: string) {
  try {
    const promptsSnapshot = await adminDb
      .collection('prompts')
      .where('folderId', '==', folderId)
      .where('userId', '==', userId)
      .orderBy('seqNo', 'asc')
      .select('name', 'content', 'contentJSON', 'shortcut')
      .get();
      
    return promptsSnapshot.docs.map(doc => {
      const data = doc.data();
      
      return {
        id: doc.id,
        name: data.name || '',
        content: data.content || '',
        contentJSON: data.contentJSON || null,
        shortcut: data.shortcut
      };
    });
  } catch (error) {
    console.error('Error getting folder prompts:', error);
    return [];
  }
}

// GET - 公開獲取資料夾內容
export async function GET(
  request: NextRequest,
  { params }: { params: { shareToken: string } }
) {
  try {
    const { shareToken } = params;

    if (!shareToken) {
      return NextResponse.json({
        available: false,
        error: ERROR_RESPONSES.NOT_FOUND
      } as PublicFolderResponse);
    }

    // 1. 驗證 shareToken
    const shareDoc = await validateShareToken(shareToken);
    
    if (!shareDoc) {
      return NextResponse.json({
        available: false,
        error: ERROR_RESPONSES.NOT_FOUND
      } as PublicFolderResponse);
    }

    const shareData = shareDoc.data();
    
    // 2. 檢查分享類型
    if (shareData.shareStatus === 'team') {
      return NextResponse.json({
        available: false,
        error: ERROR_RESPONSES.TEAM_ONLY
      } as PublicFolderResponse);
    }

    if (shareData.shareStatus !== 'public') {
      return NextResponse.json({
        available: false,
        error: ERROR_RESPONSES.INACTIVE
      } as PublicFolderResponse);
    }

    // 3. 並行查詢 folder 和 prompts 資料
    const [folderData, prompts] = await Promise.all([
      getFolderData(shareData.folderId),
      getFolderPrompts(shareData.folderId, shareData.userId)
    ]);

    // 4. 檢查 folder 是否存在
    if (!folderData) {
      return NextResponse.json({
        available: false,
        error: ERROR_RESPONSES.FOLDER_DELETED
      } as PublicFolderResponse);
    }

    // 5. 返回過濾後的公開資料
    return NextResponse.json({
      available: true,
      data: {
        folder: {
          name: folderData.name || 'Untitled Folder',
          description: folderData.description || ''
        },
        prompts: prompts
      }
    } as PublicFolderResponse);

  } catch (error) {
    console.error('Error getting public folder:', error);
    
    return NextResponse.json({
      available: false,
      error: {
        code: 'NOT_FOUND',
        message: 'An error occurred while loading this folder',
        cta: { text: "Create your own workspace", link: "/sign-up" }
      }
    } as PublicFolderResponse, { status: 500 });
  }
}