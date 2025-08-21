# PromptBear - 設計文件
*Design Document for Prompt Management Platform*

---

## 1. Overview 概述

PromptBear 是一個現代化的 Prompt 管理平台，為使用者提供創建、分享和協作 AI Prompt 的完整解決方案。本文件描述了平台的高階架構設計、技術決策以及實作方向，重點關注多使用者協作、權限管理和跨時區支援等核心功能。

## 2. Context 背景說明

### 系統背景
當前 AI 工具快速普及，使用者需要管理大量的 AI Prompts，包括個人創作、團隊協作和知識分享。現有解決方案缺乏完善的權限管理、版本控制和協作功能。

### 技術背景
- **前端框架**: Next.js 14 with App Router
- **狀態管理**: Zustand with persist middleware
- **資料庫**: Firebase Firestore
- **UI框架**: Tailwind CSS + shadcn/ui
- **部署環境**: Vercel

### 使用者角色
- **個人使用者**: 管理個人 Prompts 和資料夾
- **團隊協作者**: 參與共享空間，具有不同權限級別
- **空間擁有者**: 管理空間權限和成員邀請

## 3. Goals and Non-Goals 目標與非目標

### Goals 目標
✅ **核心功能**
- 多層級 Prompt 組織 (Space → Folder → Prompt)
- 完整的權限管理系統 (owner/edit/view)
- 即時協作和分享功能
- 跨時區支援和本地化

✅ **技術目標**
- 高性能的狀態管理和快取機制
- 可擴展的架構設計
- 良好的開發者體驗

### Non-Goals 非目標
❌ **暫不實作**
- AI Prompt 自動生成功能
- 複雜的版本控制系統
- 即時聊天功能
- 手機原生應用

## 4. High Level Design 高階設計

### 系統架構圖
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │◄──►│  Firebase Auth  │    │  Vercel Deploy  │
│  (Client Side)  │    │   & Firestore   │    │   (CDN/Edge)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│  Zustand Store  │    │   API Routes    │
│  (State Mgmt)   │    │ (Server Side)   │
└─────────────────┘    └─────────────────┘
```

### 核心架構維度

#### 1. **結構維度 (Structure)**
- **分層架構**: Presentation → Business Logic → Data Access
- **模組化設計**: 按功能域分割 (auth, prompts, spaces, sharing)
- **組件化**: 可重用的 UI 組件庫

#### 2. **行為維度 (Behavior)**
- **事件驅動**: 使用者操作觸發狀態更新
- **快取策略**: 多層快取 (Memory → LocalStorage → Database)
- **權限驗證**: Middleware 層統一處理

#### 3. **互動維度 (Interaction)**
- **RESTful API**: 標準化的資料交換
- **即時同步**: Firebase 實時監聽
- **批次操作**: 優化資料庫查詢性能

#### 4. **資訊維度 (Information)**
- **資料模型**: 階層式結構 (User → Space → Folder → Prompt)
- **權限模型**: RBAC (Role-Based Access Control)
- **快取管理**: TTL 策略和失效機制

### 關鍵組件說明

#### **前端組件 (Client-Side)**
- **App Router**: 路由管理和頁面組織
- **Zustand Store**: 狀態管理中心
- **UI Components**: shadcn/ui 基礎組件 + 自定義業務組件

#### **後端服務 (Server-Side)**
- **API Routes**: Next.js API 層處理業務邏輯
- **Middleware**: 權限驗證和請求處理
- **Firebase Admin**: 伺服器端資料庫操作

#### **基礎設施 (Infrastructure)**
- **Firebase**: 身份驗證 + Firestore 資料庫
- **Vercel**: 部署平台和 CDN
- **環境配置**: 多環境支援 (.env.local, .env.production)

### 技術決策

#### **Next.js 14 + App Router**
- **選擇原因**: 最新的 React 生態系統支援，優秀的 SSR/SSG 能力
- **替代方案**: Remix, Vite + React Router (複雜度較高，生態系統支援較少)

#### **Zustand vs Redux**
- **選擇原因**: 輕量化，TypeScript 友好，學習曲線平緩
- **替代方案**: Redux Toolkit (過於複雜), Jotai (生態系統較小)

#### **Firebase vs 自建後端**
- **選擇原因**: 快速開發，內建身份驗證，實時同步能力
- **替代方案**: PostgreSQL + Node.js (開發時間較長)

## 5. Detailed Design 詳細設計

### 資料模型設計

#### Firestore 集合結構
```
/users/{userId}
/promptSpaces/{spaceId}
/folders/{folderId}
/prompts/{promptId}
/spaceShares/{shareId}
```

```typescript
// 核心資料結構
interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

interface PromptSpace {
  id: string;
  name: string;
  userId: string; // owner
  defaultSpace?: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

// 🚨 CURRENT IMPLEMENTATION (存在擴展性問題)
interface Folder {
  id: string;
  name: string;
  description?: string;
  promptSpaceId: string;
  prompts: Prompt[]; // ⚠️ 問題：可能超過 Firestore 1MB 限制
  createdAt: Date;
  updatedAt?: Date;
}

interface Prompt {
  id: string;
  title: string;
  content: string;
  folderId: string;
  createdAt: Date;
  updatedAt?: Date;
}

// 📋 RECOMMENDED MIGRATION (建議遷移目標)
interface FolderV2 {
  id: string;
  name: string;
  description?: string;
  promptSpaceId: string;
  createdAt: Date;
  updatedAt?: Date;
  // 移除 prompts 陣列，改用關聯查詢
}

interface PromptV2 {
  id: string;
  title: string;
  content: string;
  folderId: string; // 外鍵關聯到 Folder
  promptSpaceId: string; // 冗余字段，優化查詢性能
  createdAt: Date;
  updatedAt?: Date;
}

interface SpaceShare {
  id: string;
  promptSpaceId: string;
  ownerUserId: string;
  sharedWithUserId?: string; // null for universal links
  permission: 'view' | 'edit';
  expiresAt?: Date;
  isUniversal: boolean;
}

// 查詢範例
// 獲取特定資料夾的所有 prompts
const getFolderPrompts = (folderId: string) => {
  return db.collection('prompts')
    .where('folderId', '==', folderId)
    .orderBy('createdAt', 'desc');
};

// 獲取使用者空間的所有 prompts
const getSpacePrompts = (promptSpaceId: string) => {
  return db.collection('prompts')
    .where('promptSpaceId', '==', promptSpaceId)
    .orderBy('updatedAt', 'desc');
};
```

#### 資料庫設計原則
✅ **最佳實踐**
- 每個集合分離存儲，避免巢狀陣列
- 使用複合索引優化查詢性能  
- 冗余關鍵字段減少跨集合查詢
- 實作軟刪除避免資料遺失

❌ **避免的反模式** (⚠️ 目前專案存在的問題)
- 在文檔中存儲大型陣列 (如 `prompts: Prompt[]`) - **目前使用中**
- 深度巢狀的物件結構 (>2層)
- 頻繁的跨集合關聯查詢
- 缺少適當的索引策略

#### 🔧 遷移計劃
**階段 1: 準備工作**
1. 創建新的 Firestore 索引：`prompts` 集合按 `folderId` 和 `promptSpaceId`
2. 添加 `promptSpaceId` 欄位到現有 `prompts` 文檔
3. 實作 V2 API 端點，支援新的查詢模式

**階段 2: 漸進式遷移**
1. 前端組件逐步切換到 V2 API
2. 保持 V1 和 V2 API 並存，確保向後相容
3. 監控查詢性能和資料庫使用量

**階段 3: 清理工作**
1. 移除 `folder.prompts` 陣列欄位
2. 移除舊的 V1 API 端點
3. 清理相關的前端代碼和類型定義

### 權限系統設計

```typescript
// 權限層級定義
type UserRole = 'owner' | 'edit' | 'view';
type SpaceAction = 'view' | 'edit' | 'share' | 'delete';

// 權限映射矩陣
const ROLE_PERMISSIONS: Record<SpaceAction, UserRole[]> = {
  view: ['owner', 'edit', 'view'],
  edit: ['owner', 'edit'],
  share: ['owner'],
  delete: ['owner']
};

// 中間件驗證流程
export const spaceAccessMiddleware = async (
  userId: string,
  spaceId: string,
  requiredPermission?: string
): Promise<{ success: boolean; role?: UserRole; error?: string }>;
```

### 狀態管理架構

```typescript
// Zustand Store 結構
interface AppState {
  // 使用者狀態
  user: UserSlice;
  
  // 核心業務狀態  
  promptSpaces: PromptSpaceSlice;
  folders: FolderSlice;
  prompts: PromptSlice;
  
  // UI 狀態
  ui: UISlice;
}

// 快取策略
interface CacheConfig {
  // 邀請連結過期 (30天)
  INVITE_LINK_EXPIRES_MS: 30 * 24 * 60 * 60 * 1000;
  
  // Folder 資料快取 (5分鐘)  
  FOLDER_CACHE_MS: 5 * 60 * 1000;
  
  // JWT Token 過期 (7天)
  JWT_EXPIRES_DAYS: 7;
}
```

## 6. Timeline 時間表

### 第一階段：核心功能 (4週)
- **週 1-2**: 基礎架構搭建
  - Next.js 專案初始化
  - Firebase 設定和基礎認證
  - 基本 UI 組件建立
  
- **週 3-4**: 核心業務功能
  - Prompt 和 Folder 管理
  - 基本的 CRUD 操作
  - 狀態管理實作

### 第二階段：協作功能 (3週)
- **週 5-6**: 權限系統
  - 多使用者權限管理
  - Space 分享機制
  - 存取控制中間件
  
- **週 7**: 邀請系統
  - 邀請連結生成
  - 過期機制和驗證

### 第三階段：優化和完善 (1週)
- **週 8**: 性能優化
  - 快取策略實作
  - 時區支援
  - 錯誤處理和用戶體驗改善

**注意**: 此為樂觀時間估算，實際開發可能因需求變更和技術挑戰而調整。

## 7. Risks and Open Questions 風險與開放問題

### 技術風險
🔴 **高風險**
- **Firebase 費用控制**: 大量使用者可能導致高額費用
- **即時同步性能**: 多人協作時的資料衝突處理

🟡 **中風險**  
- **Next.js App Router 穩定性**: 相對新的功能，可能有未知 bug
- **跨時區複雜性**: 不同地區使用者的時間處理

🟢 **低風險**
- **UI 組件相容性**: shadcn/ui 生態系統成熟度較高

### 開放問題
❓ **待解決問題**
1. **離線支援**: 是否需要 PWA 功能？
2. **資料匯出**: 使用者如何備份個人資料？
3. **搜尋功能**: 大量 Prompt 的搜尋和索引策略？
4. **國際化**: 多語言支援的優先級？

### 緩解策略
- **Firebase 費用**: 實作查詢優化和快取策略
- **資料衝突**: 採用樂觀鎖定和衝突解決機制
- **監控告警**: 設置性能和錯誤監控

## 8. Appendix 附錄

### 相關文件連結
- [API 文件規格](./api-specification.md)
- [資料庫 Schema](./database-schema.md)
- [部署指南](./deployment-guide.md)
- [測試策略](./testing-strategy.md)

### 技術參考
- [Next.js 14 官方文件](https://nextjs.org/docs)
- [Firebase 整合指南](https://firebase.google.com/docs/web/setup)
- [Zustand 狀態管理](https://github.com/pmndrs/zustand)
- [shadcn/ui 組件庫](https://ui.shadcn.com/)

### 程式碼範例
- [權限中間件實作](../src/middleware/spaceAccess.ts)
- [時區處理工具](../src/utils/timezone.ts)
- [快取配置管理](../src/config/cache.ts)

---

**文件版本**: v1.0  
**最後更新**: 2024-12-29  
**負責人**: Development Team  

---

*此設計文件為活文件，將根據開發進度和回饋持續更新。*