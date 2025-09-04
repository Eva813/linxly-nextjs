/**
 * Shared Folder 相關的類型定義
 * 統一管理分享資料夾功能的所有類型
 */

import { Prompt } from '@/types/prompt';

// 分享資料夾的資料結構
export interface SharedFolderData {
  folder: {
    name: string;
    description: string;
  };
  prompts: Prompt[];
}

// API 回應格式
export interface SharedFolderResponse {
  available: boolean;
  data?: SharedFolderData;
  error?: {
    code: 'NOT_FOUND' | 'INACTIVE' | 'TEAM_ONLY' | 'FOLDER_DELETED';
    message: string;
    cta: { 
      text: string; 
      link: string; 
    };
  };
}