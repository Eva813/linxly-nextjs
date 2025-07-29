/**
 * PromptSheet 動作管理 Hook
 * 統一管理所有 action handlers，使用 useCallback 確保引用穩定
 */
import { useCallback } from 'react'
import { usePromptStore } from '@/stores/prompt'
import { Prompt } from '@/types/prompt'

interface UsePromptSheetActionsProps {
  setSelectedSpaceId: (id: string) => void
  setSelectedFolder: (id: string | null) => void
  toggleFolderExpansion: (folderId: string) => void
  onAddPrompt: (prompt: Prompt) => void
}

export function usePromptSheetActions({
  setSelectedSpaceId,
  setSelectedFolder,
  toggleFolderExpansion,
  onAddPrompt,
}: UsePromptSheetActionsProps) {
  const { fetchFolders } = usePromptStore()

  // Space 切換處理 - 使用 useCallback 避免不必要的 re-render
  const handleSpaceChange = useCallback(async (spaceId: string) => {
    setSelectedSpaceId(spaceId)
    setSelectedFolder(null) // 重置 folder 選擇
    try {
      await fetchFolders(spaceId)
    } catch (error) {
      console.error('Failed to fetch folders for space:', spaceId, error)
    }
  }, [fetchFolders, setSelectedSpaceId, setSelectedFolder])

  // Folder 篩選處理
  const handleFolderSelect = useCallback((folderId: string | null) => {
    setSelectedFolder(folderId)
  }, [setSelectedFolder])

  // Prompt 新增處理
  const handlePromptAdd = useCallback((prompt: Prompt) => {
    onAddPrompt(prompt)
  }, [onAddPrompt])

  return {
    handleSpaceChange,
    toggleFolderExpansion,
    handleFolderSelect,
    handlePromptAdd,
  }
}