import request from './client';

export interface PromptSpaceOverview {
  space: {
    id: string;
    name: string;
    userRole: 'owner' | 'edit' | 'view';
    permissions: {
      canEdit: boolean;
      canDelete: boolean;
      canShare: boolean;
      canManageMembers: boolean;
    };
    createdAt: Date;
    updatedAt?: Date;
  };
  folders: Array<{
    id: string;
    name: string;
    description?: string;
    promptCount: number;
    lastUpdated: Date;
    readOnly: boolean;
  }>;
  stats: {
    totalFolders: number;
    totalPrompts: number;
  };
}

// API 回傳的原始資料型別（日期為字串格式）
type PromptSpaceOverviewAPI = {
  space: Omit<PromptSpaceOverview['space'], 'createdAt' | 'updatedAt'> & {
    createdAt: string;
    updatedAt?: string;
  };
  folders: Array<Omit<PromptSpaceOverview['folders'][0], 'lastUpdated'> & {
    lastUpdated: string;
  }>;
  stats: PromptSpaceOverview['stats'];
};

/**
 * 取得 Prompt Space 的概覽資訊（包含 folders 概要，不含 prompts）
 */
export async function getPromptSpaceOverview(spaceId: string): Promise<PromptSpaceOverview> {
  const response = await request<PromptSpaceOverviewAPI>(`/prompt-spaces/${spaceId}/overview`);
  
  // 轉換日期格式
  return {
    space: {
      ...response.space,
      createdAt: new Date(response.space.createdAt),
      updatedAt: response.space.updatedAt ? new Date(response.space.updatedAt) : undefined
    },
    folders: response.folders.map((folder) => ({
      ...folder,
      lastUpdated: new Date(folder.lastUpdated)
    })),
    stats: response.stats
  };
}