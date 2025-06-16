import { useRouter, useParams, usePathname } from "next/navigation";
import { usePromptStore } from "@/stores/prompt";
import { useSidebarStore } from "./sidebarStore";

/**
 * 側邊欄業務邏輯 Hook
 * 將業務邏輯集中管理，但仍使用同一個 Zustand store
 */
export const useSidebarActions = () => {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const params = useParams<{ folderId?: string; promptId?: string }>() || {};
  
  const {
    folders,
    addFolder,
    addPromptToFolder,
    deleteFolder,
    deletePromptFromFolder,
  } = usePromptStore();
  
  const {
    setAddingFolder,
    setAddingPrompt,
    setActiveFolderMenu,
    setActivePromptMenu,
  } = useSidebarStore();

  const determineTargetFolder = (): string | null => {
    if (params.folderId) {
      return params.folderId;
    }

    if (params.promptId) {
      const folderContainingPrompt = folders.find(folder =>
        folder.prompts?.some(prompt => prompt.id === params.promptId)
      );
      if (folderContainingPrompt) {
        return folderContainingPrompt.id;
      }
    }

    return folders.length > 0 ? folders[0].id : null;
  };

  const handleAddFolder = async () => {
    setAddingFolder(true);
    try {
      const folderData = {
        name: "New Folder",
        description: "",
        prompts: [],
      };
      const newFolder = await addFolder(folderData);
      router.push(`/prompts/folder/${newFolder.id}`);
    } catch (error) {
      console.error('新增資料夾失敗:', error);
    } finally {
      setAddingFolder(false);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      await deleteFolder(folderId);
      setActiveFolderMenu(null);
      
      if (folderId === params.folderId) {
        const updatedFolders = usePromptStore.getState().folders;
        if (updatedFolders.length > 0) {
          router.push(`/prompts/folder/${updatedFolders[0].id}`);
        } else {
          router.push("/prompts");
        }
      }
    } catch (error) {
      console.error("刪除 Folder 失敗:", error);
    }
  };

  const handleAddPrompt = async () => {
    if (!folders || folders.length === 0) return;

    const targetFolder = determineTargetFolder();
    if (!targetFolder) {
      console.error("No valid folder found to add the prompt.");
      return;
    }

    setAddingPrompt(true, targetFolder, params.promptId || null);

    try {
      const defaultPrompt = {
        name: "New prompt",
        content: "New prompt content",
        shortcut: "/newPrompt",
      };
      const newPrompt = await addPromptToFolder(targetFolder, defaultPrompt, params.promptId);
      router.push(`/prompts/prompt/${newPrompt.id}`);
    } catch (error) {
      console.error("新增 Prompt 失敗:", error);
    } finally {
      setAddingPrompt(false);
    }
  };

  const handleDeletePrompt = async (folderId: string, promptId: string) => {
    await deletePromptFromFolder(folderId, promptId);
    setActivePromptMenu(null);
    router.push(`/prompts/folder/${folderId}`);
  };

  return {
    // 業務邏輯函式
    handleAddFolder,
    handleDeleteFolder,
    handleAddPrompt,
    handleDeletePrompt,
    
    // 導航相關資料
    pathname,
    currentFolderId: params.folderId,
    currentPromptId: params.promptId,
  };
};
