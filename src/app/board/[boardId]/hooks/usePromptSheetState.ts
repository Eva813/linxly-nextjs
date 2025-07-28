/**
 * PromptSheet 狀態管理 Hook
 * 統一管理 space 選擇、folder 展開狀態和篩選邏輯
 */
import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { usePromptStore } from '@/stores/prompt'
import { usePromptSpaceStore } from '@/stores/promptSpace'

export function usePromptSheetState() {
  // Store 狀態
  const { folders } = usePromptStore()
  const { currentSpaceId, ownedSpaces, sharedSpaces } = usePromptSpaceStore()
  
  // 本地狀態
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(currentSpaceId || '')
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  
  // 使用 ref 追蹤是否已經初始化，避免狀態競爭
  const isInitialized = useRef(false)
  
  // 計算值 - 使用 useMemo 避免不必要的重新計算
  const availableSpaces = useMemo(() => {
    return [...ownedSpaces, ...sharedSpaces.map(shared => shared.space)]
  }, [ownedSpaces, sharedSpaces])
  
  const visibleFolders = useMemo(() => {
    const folderList = selectedFolder
      ? folders.filter((f) => f.id === selectedFolder)
      : folders
    return { folders: folderList }
  }, [folders, selectedFolder])

  // 只在初始化時同步 currentSpaceId，之後允許獨立切換
  useEffect(() => {
    // 使用 ref 確保只初始化一次，避免狀態競爭
    if (!isInitialized.current && (currentSpaceId || ownedSpaces.length > 0 || sharedSpaces.length > 0)) {
      if (currentSpaceId) {
        setSelectedSpaceId(currentSpaceId)
      } else {
        // 如果沒有 currentSpaceId，使用第一個可用的 space
        const firstSpace = ownedSpaces[0] || sharedSpaces[0]?.space
        if (firstSpace) {
          setSelectedSpaceId(firstSpace.id)
        }
      }
      isInitialized.current = true
    }
  }, [currentSpaceId, ownedSpaces, sharedSpaces])

  // 封裝 Set 操作函數，避免直接暴露 setExpandedFolders
  const toggleFolderExpansion = useCallback((folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(folderId)) {
        newSet.delete(folderId)
      } else {
        newSet.add(folderId)
      }
      return newSet
    })
  }, [])

  return {
    // 狀態
    folders,
    expandedFolders,
    selectedSpaceId,
    selectedFolder,
    availableSpaces,
    visibleFolders,
    
    // 分組 spaces
    ownedSpaces,
    sharedSpaces,
    
    // 狀態更新函數
    toggleFolderExpansion,
    setSelectedSpaceId,
    setSelectedFolder,
  }
}