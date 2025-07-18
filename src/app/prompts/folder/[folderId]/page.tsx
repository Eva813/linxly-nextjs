"use client";
import { usePromptStore } from "@/stores/prompt";
import { useEditableState } from "@/hooks/useEditableState";
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Textarea } from "@/components/ui/textarea";
import EditorSkeleton from '@/app/prompts/components/editorSkeleton';
import { useSaveStore } from '@/stores/loading';
import { deepEqual } from '@/lib/utils/deepEqual';
import debounce from '@/lib/utils/debounce';
import SaveStatusIndicator from '@/components/ui/saveStatusIndicator';

interface FolderPageProps {
  params: {
    folderId: string;
  };
}

const FolderPage = ({ params }: FolderPageProps) => {
  const { folderId } = params;
  const { folders, updateFolder } = usePromptStore();
  const { canEdit, getInputProps } = useEditableState();
  const { setFolderSaving, setFolderSaved, setFolderSaveError, setFolderActive } = useSaveStore();

  const currentFolder = folders.find(folder => folder.id === folderId);

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
      console.error("儲存資料夾時發生錯誤:", error);
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
    return <EditorSkeleton />;
  }

  return (
    <div className='flex flex-col relative'>
      <div className="relative">
        <SaveStatusIndicator 
          type="folder" 
          id={folderId}
          className="absolute -top-1 left-0 z-10"
        />
        <input
          type="text"
          value={formData.name}
          onChange={handleNameChange}
          {...getInputProps({
            className: "text-2xl focus:outline-none mb-2 dark:bg-black pt-4"
          })}
        />
      </div>
      <Textarea
        value={formData.description}
        rows={4}
        onChange={handleDescriptionChange}
        placeholder="input description"
        {...getInputProps({
          className: "hover:ring-1 hover:ring-gray-400 p-2 rounded mb-2 dark:border-gray-200 resize-y max-h-64"
        })}
      />

    </div>
  );
};

export default FolderPage;