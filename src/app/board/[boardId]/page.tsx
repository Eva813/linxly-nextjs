'use client';

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { usePromptStore } from "@/stores/prompt";
import { useBoardStorage } from './useBoardStorage';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Card } from "@/components/ui/card"
import {
  Plus,
  Library,
  Copy,
  Bookmark,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
// import { Badge } from "@/components/ui/badge";
import { parseHtml } from "@/lib/utils/parseHtml";
import { Prompt } from '@/types/prompt';



// 預載 Flow 組件
const FlowWithNoSSR = dynamic(() => import('../../components/flow'), {
  ssr: false,
  loading: () => (
    <div className="w-full flex items-center justify-center" style={{
      background: 'var(--background)'
    }}>
      <div className="text-xl dark:text-white">Loading Flow Editor...</div>
    </div>
  )
});

export default function BoardPage() {
  const params = useParams();
  const boardId = params?.boardId as string;
  const { boardName, setBoardName, saveBoardName } = useBoardStorage(boardId);
  const { folders, fetchFolders } = usePromptStore();

  // 選取資料夾與分頁狀態
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  // 根據選取資料夾與分頁產生過濾後的資料
  const filteredData = useMemo(() => {
    const folderList = selectedFolder
      ? folders.filter((f) => f.id === selectedFolder)
      : folders;
    const flatPrompts = folders.flatMap((f) => f.prompts);
    return { folders: folderList, flatPrompts };
  }, [folders, selectedFolder]);

  const extractTextFromHtml = (html: string) => parseHtml(html)?.textContent || '';

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  // 複製提示至剪貼簿
  const copyPromptToClipboard = (prompt: { content: string }) => {
    const text = extractTextFromHtml(prompt.content);
    navigator.clipboard.writeText(text);
  };

  // 加入提示為節點（待實作）
  const addPromptAsNode = (prompt: Prompt) => {
    console.log('Add prompt as node:', prompt);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchFolders();
      } catch (error) {
        console.error('Failed to fetch folders:', error);
      }
    };
    fetchData();
  }, [fetchFolders]);

  useEffect(() => {
      if (folders.length > 0) {
        console.log('Fetched folders:', folders);
      }
  }, [folders]);

  return (
    <div className="w-full h-[calc(100vh-64px)] bg-white-50">
      <div className="fixed top-19 left-4 flex items-center space-x-2 bg-white-50 p-2 rounded z-50">
        <Input
          type="text"
          value={boardName}
          onChange={(e) => setBoardName(e.target.value)}
          placeholder="Enter board name"
          className="w-64"
        />
        <Button type="button" onClick={saveBoardName}>Save name</Button>


        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <Library className="w-4 h-4 mr-2" />
              Prompt 庫
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-96 h-full flex flex-col p-4">
            <SheetHeader>
              <SheetTitle>Prompt 庫</SheetTitle>
            </SheetHeader>
            <div className="mt-2 space-y-2 flex-1 overflow-hidden flex flex-col">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedFolder === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFolder(null)}
                >
                  全部資料夾
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
                <div className="">
                  {/* 資料夾檢視 */}
                  {filteredData.folders.map((folder) => (
                    <div key={folder.id} className="space-y-2 mr-4">
                      <Collapsible
                        open={expandedFolders.has(folder.id)}
                        onOpenChange={() => toggleFolder(folder.id)}
                      >
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" className="w-full justify-start py-2 h-12 mb-2">
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
                            <Card key={prompt.id} className="p-3">
                              <div className="space-y-2">
                                <div className="flex items-start justify-between">
                                  <h4 className="font-medium text-sm">{prompt.name}</h4>
                                  {/* <Badge variant="outline" className="text-xs">
                                    {prompt.shortcut}
                                  </Badge> */}
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {extractTextFromHtml(prompt.content)}
                                </p>
                                <div className="flex gap-2 pt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyPromptToClipboard(prompt)}
                                    className="flex-1"
                                  >
                                    <Copy className="w-3 h-3 mr-1" />
                                    複製
                                  </Button>
                                  <Button size="sm" onClick={() => addPromptAsNode(prompt)} className="flex-1">
                                    <Plus className="w-3 h-3 mr-1" />
                                    加入
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      <FlowWithNoSSR boardId={boardId} />
    </div>
  );
}
