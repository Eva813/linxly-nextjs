/**
 * PromptSheet 主組件
 * 用於在 Board 頁面中選擇和添加 Prompts
 * 支援多 Space 切換和 Folder 篩選功能
 */
'use client'

import React from 'react'
import { Library } from 'lucide-react'
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Prompt } from '@/types/prompt'

// 自定義 hooks
import { usePromptSheetState } from '../hooks/usePromptSheetState'
import { usePromptSheetActions } from '../hooks/usePromptSheetActions'

// 子組件
import { SpaceSelector } from './promptSheet/spaceSelector'
import { FolderSection } from './promptSheet/folderSection'

interface PromptSheetProps {
  selectedFolder: string | null
  setSelectedFolder: (id: string | null) => void
  onAddPrompt: (prompt: Prompt) => void
}

export default function PromptSheet({
  selectedFolder: externalSelectedFolder,
  setSelectedFolder: externalSetSelectedFolder,
  onAddPrompt,
}: PromptSheetProps) {
  // 使用自定義 hooks 管理狀態和動作
  const state = usePromptSheetState()
  const {
    folders,
    expandedFolders,
    selectedSpaceId,
    selectedFolder,
    visibleFolders,
    ownedSpaces,
    sharedSpaces,
    setExpandedFolders,
    setSelectedSpaceId,
    setSelectedFolder,
  } = state

  // 使用外部傳入的 selectedFolder 狀態，如果沒有則使用內部狀態
  const currentSelectedFolder = externalSelectedFolder ?? selectedFolder
  const currentSetSelectedFolder = externalSetSelectedFolder ?? setSelectedFolder

  const actions = usePromptSheetActions({
    setSelectedSpaceId,
    setSelectedFolder: currentSetSelectedFolder,
    setExpandedFolders,
    onAddPrompt,
  })

  const {
    handleSpaceChange,
    toggleFolder,
    handleFolderSelect,
    handlePromptAdd,
  } = actions

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="hover:bg-light hover:border-light h-9">
          <Library className="w-4 h-4 mr-1" />
          Prompts
        </Button>
      </SheetTrigger>
      
      <SheetContent 
        side="right" 
        className="w-96 h-full flex flex-col p-4" 
        aria-describedby={undefined}
      >
        <SheetHeader>
          <SheetTitle>Prompts</SheetTitle>
        </SheetHeader>
        
        {/* Space 選擇器 */}
        <SpaceSelector
          selectedSpaceId={selectedSpaceId}
          ownedSpaces={ownedSpaces}
          sharedSpaces={sharedSpaces}
          onSpaceChange={handleSpaceChange}
        />
        
        {/* Folder 區域 */}
        <FolderSection
          folders={folders}
          selectedFolder={currentSelectedFolder}
          expandedFolders={expandedFolders}
          visibleFolders={visibleFolders}
          onFolderSelect={handleFolderSelect}
          onToggleFolder={toggleFolder}
          onPromptAdd={handlePromptAdd}
        />
      </SheetContent>
    </Sheet>
  )
}
