'use client'

import {
  Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle
} from "@/components/ui/sheet"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Bookmark, ChevronDown, ChevronRight, Folder, FolderOpen, Library } from "lucide-react"
import { useState, useMemo, useCallback } from "react"
import PromptCardOptimized from "./promptCard"
import { usePromptStore } from "@/stores/prompt"
import { Prompt } from "@/types/prompt"

export default function PromptSheet({
  selectedFolder,
  setSelectedFolder,
  onAddPrompt
}: {
  selectedFolder: string | null;
  setSelectedFolder: (id: string | null) => void;
  onAddPrompt: (prompt: Prompt) => void;
}) {
  const { folders } = usePromptStore()
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  const toggleFolder = useCallback((id: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    })
  }, [])

  const visibleFolders = useMemo(() => {
    const folderList = selectedFolder
      ? folders.filter((f) => f.id === selectedFolder)
      : folders;
    return { folders: folderList }
  }, [folders, selectedFolder])

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className='hover:bg-light hover:border-light h-9'>
          <Library className="w-4 h-4 mr-1" />
          Prompts
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-96 h-full flex flex-col p-4" aria-describedby={undefined}>
        <SheetHeader>
          <SheetTitle>Prompts</SheetTitle>
        </SheetHeader>
        <div className="mt-2 space-y-2 flex-1 overflow-hidden flex flex-col">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedFolder === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFolder(null)}
            >
              All
            </Button>
            {folders.map((folder) => (
              <Button
                key={folder.id}
                variant={selectedFolder === folder.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFolder(folder.id)}
              >
                <Bookmark className="w-3 h-3 mr-1" />
                {folder.name}
              </Button>
            ))}
          </div>

          <ScrollArea className="flex-1 overflow-y-auto">
            {visibleFolders.folders.map((folder) => (
              <div key={folder.id} className="space-y-2 mr-4">
                <Collapsible
                  open={expandedFolders.has(folder.id)}
                  onOpenChange={() => toggleFolder(folder.id)}
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
                      <PromptCardOptimized
                        key={prompt.id}
                        prompt={prompt}
                        onAdd={onAddPrompt}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            ))}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  )
}
