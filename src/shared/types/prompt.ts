/**
 * 共用的 Prompt 類型定義
 * 可以被前端和後端同時使用
 */

// 統一的 PromptData 介面
export interface PromptData {
  id: string;
  name: string;
  content: string;
  shortcut: string;
  seqNo?: number | null;
  createdAt?: Date | { seconds: number; nanoseconds?: number } | null;
  folderId: string;
  userId: string;
  promptSpaceId: string;
}

// API 回應格式
export interface PromptApiResponse {
  id: string;
  name: string;
  content: string;
  shortcut: string;
  seqNo?: number;
}

// PromptSpace 類型
export interface PromptSpaceData {
  id: string;
  name: string;
  userId: string;
  createdAt?: Date | { seconds: number; nanoseconds?: number } | null;
}

// Folder 類型
export interface FolderData {
  id: string;
  name: string;
  description?: string;
  userId: string;
  promptSpaceId: string;
  prompts?: PromptApiResponse[];
}
