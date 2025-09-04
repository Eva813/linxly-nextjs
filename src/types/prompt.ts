import React from "react";
import type { JSONContent } from '@tiptap/react';

export interface Prompt {
  id: string;
  name: string;
  content: string;
  contentJSON?: JSONContent | null;
  shortcut?: string;
  seqNo?: number; // 新增排序欄位，可選是因為要支援 Lazy Migration
}

export interface Folder {
  id: string;
  name: string;
  description: string;
  prompts: Prompt[];
  createdAt?: string;
}

export interface MatchedPrompt {
  content: string;
  targetElement: HTMLInputElement | HTMLTextAreaElement | null;
  insert: boolean;
  shortcut: string;
}

/**
 * FolderItem 元件的 Props
 */
export interface FolderItemProps {
  folder: Folder;
  children?: React.ReactNode;
}

/**
 * PromptItem 元件的 Props
 */
export interface PromptItemProps {
  prompt: Prompt;
  folderId: string;
}

export interface FormMenuData {
  pos: number;
  name: string;
  default: string | string[];
  options: string[];
  multiple: boolean;
}

export type FormMenuClickHandler = (data: FormMenuData) => void;

export interface InputInfo {
  pos: number;
  name: string;
  default: string | string[];
  type: string;
  [key: string]: string | number | boolean | string[] | null;
}

export interface TextInputEditInfo extends InputInfo {
  type: "formtext";
  pos: number;
  name: string;
  default: string;
}

export interface DropdownEditInfo extends InputInfo {
  type: "formmenu";
  pos: number;
  name: string;
  options: string[]; // 統一用複數且必填
  multiple: boolean;
  default: string | string[];
}

export type EditInfo = TextInputEditInfo | DropdownEditInfo;