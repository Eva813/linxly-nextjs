# 檔案結構重構指南

## 新的檔案組織架構

根據前後端分離的最佳實務，我們重新組織了檔案結構：

### 📁 `src/server/` - 後端邏輯
專門處理 API 路由、資料庫操作等後端邏輯

- `server/db/` - 資料庫連接和設定
- `server/utils/` - 後端專用工具函式
- `server/services/` - 業務邏輯服務（未來可擴展）

### 📁 `src/shared/` - 前後端共用
存放可以被前端和後端同時使用的類型定義、常數等

- `shared/types/` - TypeScript 類型定義
- `shared/constants/` - 常數定義（未來可擴展）

### 📁 `src/lib/` - 前端專用
只包含前端相關的工具函式和 hooks

### 📁 `src/components/` - React 元件
前端 UI 元件

## 遷移說明

### 之前
```typescript
import { promptUtils } from '@/lib/utils/promptUtils';
```

### 現在
```typescript
// 後端 API 中
import { promptUtils } from '@/server/utils/promptUtils';
import type { PromptData } from '@/shared/types/prompt';

// 前端元件中
import type { PromptData } from '@/shared/types/prompt';
```

## 優點

1. **清晰的關注點分離**: 前端和後端邏輯明確分開
2. **更好的程式碼組織**: 每個目錄都有明確的職責
3. **減少耦合**: 前端不會意外使用後端專用的邏輯
4. **類型安全**: 共用類型確保前後端的資料一致性
5. **更容易維護**: 檔案結構更直觀，便於團隊協作

## 檔案對應表

| 舊位置 | 新位置 | 說明 |
|--------|--------|------|
| `lib/utils/promptUtils.ts` | `server/utils/promptUtils.ts` | 後端 prompt 工具函式 |
| - | `shared/types/prompt.ts` | 前後端共用的類型定義 |
| - | `server/db/firebase.ts` | Firebase Admin 設定 |
