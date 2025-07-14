/**
 * PromptSpace 類型定義
 * 用於前端和後端的 PromptSpace 資料結構
 */

export interface PromptSpaceData {
  id: string;
  name: string;
  userId: string;
  createdAt: Date | { seconds: number; nanoseconds?: number };
  updatedAt?: Date | { seconds: number; nanoseconds?: number };
}

export interface PromptSpaceApiResponse {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreatePromptSpaceRequest {
  name: string;
}

export interface UpdatePromptSpaceRequest {
  name: string;
}

export interface PromptSpaceListResponse {
  spaces: PromptSpaceApiResponse[];
}