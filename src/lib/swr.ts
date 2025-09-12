// SWR 配置和 fetcher 函數
export const fetcher = async (url: string) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超時

  try {
    const response = await fetch(url, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      throw error;
    }
    throw new Error('Failed to fetch data');
  }
};

// 共享資料夾的 SWR 配置
export const sharedFoldersConfig = {
  refreshInterval: 0, // 關閉自動更新
  dedupingInterval: 60 * 60 * 1000, // 1小時去重
  revalidateOnFocus: false, // 關閉焦點更新
  revalidateOnReconnect: false, // 關閉重連更新
  errorRetryCount: 2, // 最多重試2次
  errorRetryInterval: 1000, // 重試間隔1秒
};
