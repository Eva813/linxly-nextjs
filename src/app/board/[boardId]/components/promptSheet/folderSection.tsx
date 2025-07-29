/**
 * Folder 區域組件
 * 包含 folder 篩選按鈕和 folder 列表，因為它們邏輯緊密相關
 */
import React from 'react'
import { Bookmark, ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Folder as FolderType, Prompt } from '@/types/prompt'
import PromptCard from '../promptCard'

interface FolderSectionProps {
  folders: FolderType[]
  selectedFolder: string | null
  expandedFolders: Set<string>
  visibleFolders: { folders: FolderType[] }
  onFolderSelect: (folderId: string | null) => void
  onToggleFolder: (folderId: string) => void
  onPromptAdd: (prompt: Prompt) => void
}

export const FolderSection = React.memo<FolderSectionProps>(({
  folders,
  selectedFolder,
  expandedFolders,
  visibleFolders,
  onFolderSelect,
  onToggleFolder,
  onPromptAdd,
}) => {
  return (
    <div className="space-y-2 flex-1 overflow-hidden flex flex-col">
      {/* Folder 篩選按鈕 */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedFolder === null ? "default" : "outline"}
          size="sm"
          onClick={() => onFolderSelect(null)}
        >
          All
        </Button>
        {folders.map((folder) => (
          <Button
            key={folder.id}
            variant={selectedFolder === folder.id ? "default" : "outline"}
            size="sm"
            onClick={() => onFolderSelect(folder.id)}
          >
            <Bookmark className="w-3 h-3 mr-1" />
            {folder.name}
          </Button>
        ))}
      </div>

      {/* Folder 列表 */}
      <ScrollArea className="flex-1 overflow-y-auto">
        {visibleFolders.folders.map((folder) => (
          <div key={folder.id} className="space-y-2 mr-4">
            <Collapsible
              open={expandedFolders.has(folder.id)}
              onOpenChange={() => onToggleFolder(folder.id)}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-start py-2 h-12 mb-2 hover:bg-light">
                  {expandedFolders.has(folder.id) ? (
                    <ChevronDown className="w-4 h-4 mr-2" />
                  ) : (
                    <ChevronRight className="w-4 h-4 mr-2" />
                  )}
                  {expandedFolders.has(folder.id) ? (
                    <FolderOpen className="w-4 h-4 mr-2" />
                  ) : (
                    <Folder className="w-4 h-4 mr-2" />
                  )}
                  <div className="text-left">
                    <div className="font-medium">{folder.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {folder.prompts.length} prompts
                      {folder.description && ` • ${folder.description}`}
                    </div>
                  </div>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="ml-6 space-y-2">
                {folder.prompts.map((prompt) => (
                  <PromptCard
                    key={prompt.id}
                    prompt={prompt}
                    onAdd={onPromptAdd}
                  />
                ))}
              </CollapsibleContent>
            </Collapsible>
          </div>
        ))}
      </ScrollArea>
    </div>
  )
})

FolderSection.displayName = 'FolderSection'