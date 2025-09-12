// 簡單的記憶體快取實現
interface CacheItem<T> {
  data: T;
  expires: number;
}

class MemoryCache {
  private cache = new Map<string, CacheItem<unknown>>();

  set<T>(key: string, data: T, ttlMs: number): void {
    const expires = Date.now() + ttlMs;
    this.cache.set(key, { data, expires });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // 清理過期項目
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }

  // 獲取快取統計
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// 全域快取實例
export const memoryCache = new MemoryCache();

// 定期清理過期項目 (每5分鐘)
if (typeof window === 'undefined') {
  setInterval(
    () => {
      memoryCache.cleanup();
    },
    5 * 60 * 1000
  );
}
