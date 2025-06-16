import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';

import { SidebarUISlice, createSidebarUISlice } from './slices/uiSlice';
import { SidebarLoadingSlice, createSidebarLoadingSlice } from './slices/loadingSlice';
import { SidebarActionsSlice, createSidebarActionsSlice } from './slices/actionsSlice';

export type SidebarStore = SidebarUISlice & SidebarLoadingSlice & SidebarActionsSlice;

/**
 * 側邊欄狀態管理 Store
 * 
 * 使用 slice 模式組織狀態，功能包括：
 * - UI 狀態管理（選單展開/折疊、活躍項目）
 * - 載入狀態管理（新增資料夾/提示時的載入指示）
 * - 業務邏輯操作（建立資料夾/提示的完整流程）
 * 
 * 採用 Zustand 的最佳實踐：
 * - subscribeWithSelector: 支援選擇性訂閱，提升效能
 * - persist: 持久化重要的 UI 狀態（如折疊狀態）
 * - devtools: 開發工具整合，方便除錯
 */
export const useSidebarStore = create<SidebarStore>()(
  devtools(
    subscribeWithSelector(
      persist(
        (set, get, api) => ({
          ...createSidebarUISlice(set, get, api),
          ...createSidebarLoadingSlice(set, get, api),
          ...createSidebarActionsSlice(set, get, api),
        }),
        {
          name: 'sidebar-storage',
          partialize: (state) => ({ 
            collapsedFolderIds: Array.from(state.collapsedFolderIds)
          }),
          merge: (persistedState, currentState) => {
            // 合併持久化狀態並將 Array 轉回 Set
            const persisted = persistedState as Partial<Pick<SidebarStore, 'collapsedFolderIds'>>;
            return {
              ...currentState,
              ...persistedState,
              collapsedFolderIds: new Set(
                Array.isArray(persisted.collapsedFolderIds) ? persisted.collapsedFolderIds : []
              ),
            };
          },
        }
      )
    ),
    { 
      name: 'SidebarStore',
      // 開發環境下的序列化設定，用於 Redux DevTools
      ...(process.env.NODE_ENV === 'development' && {
        serialize: {
          set: new Map([
            ['collapsedFolderIds', (value: Set<string>) => Array.from(value)],
          ]),
        },
      }),
    }
  )
);

export type * from './slices/uiSlice';
export type * from './slices/loadingSlice';
export type * from './slices/actionsSlice';
