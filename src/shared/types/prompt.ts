/**
 * 共用的 Prompt 類型定義
 * 可以被前端和後端同時使用
 */

import type { JSONContent } from '@tiptap/react';

// 統一的 PromptData 介面
export interface PromptData {
  id: string;
  name: string;
  content: string;
  contentJSON?: JSONContent | null;
  shortcut: string;
  seqNo?: number | null;
  createdAt?: Date | { seconds: number; nanoseconds?: number } | null;
  folderId: string;
  userId: string;
}

// API 回應格式
export interface PromptApiResponse {
  id: string;
  name: string;
  content: string;
  contentJSON?: JSONContent | null;
  shortcut: string;
  seqNo?: number;
}

// Folder 類型
export interface FolderData {
  id: string;
  name: string;
  description?: string;
  userId: string;
  prompts?: PromptApiResponse[];
}
