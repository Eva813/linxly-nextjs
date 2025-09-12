import { useMemo, useState, useEffect } from 'react';
import { usePromptStore } from '@/stores/prompt';
import { getPrompt } from '@/api/prompts';
import { Prompt } from '@/types/prompt';

export function useCurrentPrompt(promptId: string) {
  const { folders } = usePromptStore();
  const [directPrompt, setDirectPrompt] = useState<Prompt | null>(null);
  const [directLoading, setDirectLoading] = useState(false);

  // 從 folders 中尋找 prompt 的原始邏輯
  const folderPrompt = useMemo(() => {
    if (!folders.length) {
      return null;
    }

    for (const folder of folders) {
      const prompt = folder.prompts.find((s: Prompt) => s.id === promptId);
      if (prompt) {
        return prompt;
      }
    }

    return null;
  }, [folders, promptId]);

  // 直接調用 API 的情況：
  // 1. 在 folders 中找到 prompt 但內容為空
  // 2. 在 folders 中找不到 prompt (可能是 shared prompt)
  useEffect(() => {
    const shouldCallAPI =
      // 情況1: 找到 prompt 但內容為空
      ((folderPrompt &&
        (!folderPrompt.contentJSON ||
          Object.keys(folderPrompt.contentJSON || {}).length === 0) &&
        (!folderPrompt.content || folderPrompt.content.trim() === '')) ||
        // 情況2: 找不到 prompt 且 folders 已載入 (可能是 shared prompt)
        (!folderPrompt && folders.length > 0)) &&
      !directLoading &&
      !directPrompt;

    if (shouldCallAPI) {
      setDirectLoading(true);

      getPrompt(promptId)
        .then((data: Prompt) => {
          setDirectPrompt(data);
          setDirectLoading(false);
        })
        .catch((err) => {
          console.error('直接 API 調用失敗:', err);
          setDirectLoading(false);
        });
    }
  }, [folderPrompt, promptId, directLoading, directPrompt, folders.length]);

  return useMemo(() => {
    // 優先使用直接 API 取得的完整資料
    if (directPrompt) {
      return { prompt: directPrompt, loading: false, error: null };
    }

    // 如果正在直接載入
    if (directLoading) {
      return { prompt: folderPrompt, loading: true, error: null };
    }

    // 只有當 folders 為空時才認為是載入中
    if (!folders.length) {
      return { prompt: null, loading: true, error: null };
    }

    // 使用 folder 中的 prompt
    if (folderPrompt) {
      return { prompt: folderPrompt, loading: false, error: null };
    }

    // 找不到 prompt
    return { prompt: null, loading: false, error: 'Prompt not found' };
  }, [directPrompt, directLoading, folderPrompt, folders.length]);
}
