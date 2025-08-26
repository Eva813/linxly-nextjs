"use client";
import { usePromptStore } from "@/stores/prompt";
import { useEditableState } from "@/hooks/useEditableState";
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import EditorSkeleton from '@/app/prompts/components/editorSkeleton';
import { useSaveStore } from '@/stores/loading';
import { deepEqual } from '@/lib/utils/deepEqual';
import debounce from '@/lib/utils/debounce';
import SaveStatusIndicator from '@/components/ui/saveStatusIndicator';
import { Card, CardContent } from "@/components/ui/card";
import { Settings2 } from "lucide-react";
import Link from "next/link";
import { generateCompatibleSafeHTML, analyzeInteractiveElements, extractTextContent } from "@/lib/utils/generateSafeHTML";
import type { JSONContent } from '@tiptap/react';
import type { Prompt } from '@/types/prompt';

interface FolderPageProps {
  params: {
    folderId: string;
  };
}

// 提取內容資訊的輔助函式
const extractContentInfo = (content: string | JSONContent | null | undefined, contentJSON?: JSONContent | null | undefined) => {
  const analysis = analyzeInteractiveElements(content, contentJSON);
  const safeHTML = generateCompatibleSafeHTML(content, contentJSON);
  let cleanText = extractTextContent(content, contentJSON);

  if (analysis.totalCount <= 4) {
    cleanText = safeHTML
      .replace(/<span[^>]*data-type=\"formtext\"[^>]*><\/span>/g, " [input field] ")
      .replace(/<span[^>]*data-type=\"formmenu\"[^>]*><\/span>/g, " [dropdown menu] ")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  } else {
    cleanText = safeHTML
      .replace(/<span[^>]*data-type=\"[^\"]*\"[^>]*><\/span>/g, " [...] ")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  }

  return {
    interactiveCount: analysis.totalCount,
    cleanText,
    formTextCount: analysis.formTextCount,
    formMenuCount: analysis.formMenuCount,
  }
}

// Prompt 項目卡片組件
const PromptItemCard = ({ prompt }: { prompt: Prompt }) => {
  const { interactiveCount, cleanText, formTextCount, formMenuCount } = extractContentInfo(
    prompt.content, 
    prompt.contentJSON
  );
  const hasInteractiveElements = interactiveCount > 0;

  return (
    <Card className="w-full hover:shadow-md transition-shadow rounded-md">
      <CardContent className="p-4">
        <Link href={`/prompts/prompt/${prompt.id}`} className="block">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1">
                <h4 className="font-medium text-sm">{prompt.name}</h4>
                {hasInteractiveElements && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Settings2 className="h-3 w-3" />
                    <span className="text-xs">{interactiveCount}</span>
                  </div>
                )}
              </div>
              {prompt.shortcut && (
                <span className="inline-block px-2 py-1 border border-secondary dark:border-third text-xs rounded-full ml-2">
                  {prompt.shortcut}
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground line-clamp-2">{cleanText}</p>

            {interactiveCount > 2 && (
              <div className="flex gap-2 text-xs text-muted-foreground">
                {formTextCount > 0 && <span>{formTextCount} input fields</span>}
                {formMenuCount > 0 && <span>{formMenuCount} dropdown menus</span>}
              </div>
            )}
          </div>
        </Link>
      </CardContent>
    </Card>
  );
};

const FolderPage = ({ params }: FolderPageProps) => {
  const { folderId } = params;
  const { updateFolder } = usePromptStore();
  const { canEdit } = useEditableState();
  const { setFolderSaving, setFolderSaved, setFolderSaveError, setFolderActive } = useSaveStore();

  // 使用 memoized selector 只訂閱特定的 folder，避免因整個 folders 陣列變化而重新渲染
  const currentFolder = usePromptStore(
    useCallback(state => state.folders.find(folder => folder.id === folderId), [folderId])
  );

  // 表單狀態
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  
  // 儲存初始值用於比較
  const [initialValues, setInitialValues] = useState({
    name: '',
    description: ''
  });

  // 直接的儲存函式，帶有完整的狀態管理
  const saveFolder = useCallback(async () => {
    if (!currentFolder || !canEdit) return;

    try {
      setFolderSaving(true, folderId);
      await updateFolder(folderId, formData);
      
      setFolderSaved(folderId);
      setInitialValues(formData);
    } catch (error) {
      setFolderSaveError(true, folderId);
      console.error("An error occurred while saving the folder:", error);
    }
  }, [currentFolder, canEdit, formData, folderId, updateFolder, setFolderSaving, setFolderSaved, setFolderSaveError]);

  // 建立 debounced 的儲存函式
  const debouncedSave = useMemo(
    () => debounce(async () => {
      await saveFolder();
    }, 1000),
    [saveFolder]
  );

  // 統一的表單更新函式
  const updateFormField = useCallback((field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // 表單處理器
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateFormField('name', e.target.value);
  }, [updateFormField]);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateFormField('description', e.target.value);
  }, [updateFormField]);

  // 監聽 currentFolder 的變化，並更新本地狀態
  useEffect(() => {
    if (currentFolder) {
      const initialData = {
        name: currentFolder.name,
        description: currentFolder.description
      };
      
      setFormData(initialData);
      setInitialValues(initialData);
    }
  }, [currentFolder]);

  // 檢查變更並觸發 debounce 自動儲存
  useEffect(() => {
    const hasChanges = !deepEqual(formData, initialValues);
    
    if (hasChanges && currentFolder && canEdit) {
      setFolderActive(true, folderId);
      debouncedSave();
    } else if (!hasChanges) {
      // 當沒有變更時，設定為非 active 狀態
      setFolderActive(false, folderId);
    }
    
    return () => {
      debouncedSave.cancel();
    };
  }, [formData, initialValues, currentFolder, canEdit, debouncedSave, setFolderActive, folderId]);

  if (!currentFolder) {
    console.log(`Folder ${folderId} not found in current folders`);
    return <EditorSkeleton />;
  }

  console.log(`Rendering folder ${folderId}:`, {
    name: currentFolder.name,
    promptCount: currentFolder.prompts?.length || 0,
    prompts: currentFolder.prompts?.map(p => ({ id: p.id, name: p.name })) || []
  });

  return (
    <div className='flex flex-col h-full'>
      {/* Folder 資訊編輯區域 */}
      <div className="flex-shrink-0 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <SaveStatusIndicator 
            type="folder" 
            id={folderId}
            className="absolute -top-[10px] left-0 z-10"
          />
          <Input
            type="text"
            value={formData.name}
            onChange={handleNameChange}
            disabled={!canEdit}
            className="!text-2xl border-none focus:outline-none focus-visible:ring-0 shadow-none mb-2 dark:bg-black pt-4 px-0"
          />
        </div>
        <Textarea
          value={formData.description}
          rows={2}
          onChange={handleDescriptionChange}
          placeholder="input description"
          disabled={!canEdit}
          className="hover:ring-1 hover:ring-gray-400 p-2 rounded mb-2 dark:border-gray-200 resize-y max-h-20"
        />
      </div>

      {/* Prompts 列表區域 */}
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex-shrink-0 mb-4">
          <h3 className="text-lg font-semibold">Prompts ({currentFolder.prompts?.length || 0})</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {!currentFolder.prompts || currentFolder.prompts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              There are currently no prompts in this folder
            </div>
          ) : (
            <div className="space-y-3 pr-2">
              {currentFolder.prompts.map((prompt) => (
                <PromptItemCard 
                  key={prompt.id} 
                  prompt={prompt} 
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default FolderPage;