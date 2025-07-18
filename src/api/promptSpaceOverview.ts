import request from './client';

const client = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, data?: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(data) }),
  put: <T>(path: string, data?: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(data) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

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

export const promptSpaceOverviewApi = {
  /**
   * 取得 Prompt Space 的概覽資訊（包含 folders 概要，不含 prompts）
   */
  async getOverview(spaceId: string): Promise<PromptSpaceOverview> {
    interface APIResponse {
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
        createdAt: string;
        updatedAt?: string;
      };
      folders: Array<{
        id: string;
        name: string;
        description?: string;
        promptCount: number;
        lastUpdated: string;
        readOnly: boolean;
      }>;
      stats: {
        totalFolders: number;
        totalPrompts: number;
      };
    }

    const response = await client.get<APIResponse>(`/prompt-spaces/${spaceId}/overview`);
    
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
};