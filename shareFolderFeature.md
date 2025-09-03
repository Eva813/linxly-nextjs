# Folder 公開分享功能 - 完整產品需求規格

**文件版本**: 1.0  
**最後更新**: 2025-09-02  
**專案**: PromptBear - Linxly Next.js  

---

## 1. 功能概述

### 產品目標
為 sidebar 中的 Folder 新增公開分享功能，允許用戶將特定資料夾通過公開連結分享給任何人查看，無需註冊或登入即可存取資料夾內的 prompts。

### 核心價值
- **內容分享**: 用戶可輕鬆分享 prompt 集合
- **安全性**: 使用 shareToken 隱藏實際 folderId
- **可擴展性**: 為未來 Team sharing 功能預留架構
- **用戶獲取**: 公開頁面引導訪客註冊

### 設計原則
1. **ShareToken 永久綁定**: Token 與 folder 一對一綁定，停止分享時保留 token
2. **友善錯誤處理**: 失效連結顯示訊息而非 404 頁面
3. **權限優先**: 只有 folder 擁有者可管理分享
4. **架構重用**: 基於現有 Firebase 和權限系統
5. **公開訪問**: 任何人（未登入、登入用戶）都可通過有效 shareToken 查看

---

## 2. UI/UX 設計規格

### 2.1 FolderItem DropdownMenu 擴展

**位置**: `src/app/prompts/components/sidebar/folderItem.tsx:105-132`

**新增項目**:
```jsx
{canEdit && (
  <>
    <DropdownMenuItem>
      <button onClick={handleShareClick} className="w-full text-left">
        Share Folder
      </button>
    </DropdownMenuItem>
    <DropdownMenuItem>
      <button onClick={handleDeleteClick} className="w-full text-left">
        Delete
      </button>
    </DropdownMenuItem>
  </>
)}
```

**觸發條件**:
- 用戶必須是 folder 擁有者 (folder.userId === currentUserId)
- 點擊開啟 FolderShareDialog

### 2.2 FolderShareDialog 設計

**檔案**: `src/components/folder/FolderShareDialog.tsx`

**Dialog 結構**:
- **標題**: "Share [資料夾名稱]"
- **問題文字**: "Who do you want to share [資料夾名稱] with?"
- **三個分享選項**:

| 選項 | 標題 | 描述 | 功能 | 狀態 |
|------|------|------|------|------|
| None | None | 不分享此資料夾 | 停用所有分享 | 可用 |
| Team Only | Team Only | Team sharing feature coming soon | 預留未來功能 | **Disabled** |
| Public | Public | Anyone with the link can view this folder | 啟用公開分享 | 可用 |

**Team Only 選項處理**:
```jsx
<RadioGroupItem value="team" disabled>
  <div className="opacity-50">
    <div>Team Only</div>
    <div className="text-gray-400">Team sharing feature coming soon</div>
  </div>
</RadioGroupItem>
```

**公開連結區域** (僅 Public 選中時顯示):
- 連結格式: `https://app.linxly.ai/shared/folder/[shareToken]`
- `https://app.linxly.ai` 為環境變數 `NEXT_PUBLIC_APP_BASE_URL`
- Copy 按鈕實現一鍵複製
- 藍色背景框強調

### 2.3 公開檢視頁面設計

**路由**: `/shared/folder/[shareToken]`

**正常顯示**:
- Folder 名稱和描述
- 所有 Prompts 的只讀卡片顯示
- 底部 "Create your own workspace" CTA 按鈕

**失效狀態**:
- 標題: "Folder Not Available" 
- 訊息: "This folder is no longer publicly available"
- CTA: "Create your own workspace" 按鈕

---

## 3. 後端技術規格 (Firebase/Firestore)

### 3.1 資料結構設計

#### Firestore Collection: `folder_shares`
```typescript
interface FolderShareDocument {
  id: string;                    // Firestore document ID
  folderId: string;             // 關聯的資料夾 ID
  userId: string;               // 創建分享的用戶 ID
  shareToken: string;           // 永久綁定的分享 token (UUID)
  shareType: 'public' | 'team' | 'none'; // 分享類型
  isActive: boolean;            // 分享是否啟用
  createdAt: FieldValue.serverTimestamp();
  updatedAt: FieldValue.serverTimestamp();
}
```

#### 索引設計
```javascript
// Firestore 複合索引
{ fields: ['shareToken'], orders: ['asc'] }
{ fields: ['folderId', 'userId'], orders: ['asc', 'asc'] }
{ fields: ['userId', 'isActive'], orders: ['asc', 'asc'] }
```

### 3.2 API 端點設計

#### 分享管理 API: `/api/v1/folders/[folderId]/shares/route.ts`

**POST - 創建/更新分享設定**
```typescript
// Request
{
  shareType: 'public' | 'team' | 'none'
}

// Response
{
  shareToken?: string,
  shareType: string,
  isActive: boolean,
  message: string
}

// 邏輯流程
1. 驗證用戶權限 (x-user-id header + folder ownership only)
2. 查詢現有 folder_shares 記錄
3. 如果無記錄且 shareType !== 'none': 創建新記錄 + 生成 shareToken
4. 如果有記錄: 更新 shareType 和 isActive
5. 返回當前分享狀態
```

**GET - 獲取分享狀態**
```typescript
// Response
{
  shareType: 'public' | 'team' | 'none',
  shareToken?: string,
  isActive: boolean
}
```

**DELETE - 停用分享**
```typescript
// 設定 isActive: false，保留記錄和 token
// Response: 204 No Content
```

#### 公開訪問 API: `/api/v1/shared/folder/[shareToken]/route.ts`

**GET - 公開獲取資料夾內容**
```typescript
// 統一回應格式
interface PublicFolderResponse {
  available: boolean;
  data?: {
    folder: { name: string; description: string; };
    prompts: Array<{ id: string; name: string; content: string; shortcut?: string; }>;
  };
  error?: {
    code: 'NOT_FOUND' | 'INACTIVE' | 'TEAM_ONLY' | 'FOLDER_DELETED';
    message: string;
    cta: { text: string; link: string; };
  };
}

// 成功回應
{
  available: true,
  data: {
    folder: { name: string, description: string },
    prompts: Array<{ id: string, name: string, content: string, shortcut?: string }>
  }
}

// 失效回應範例
{
  available: false,
  error: {
    code: "INACTIVE",
    message: "This folder is no longer publicly available",
    cta: { text: "Create your own workspace", link: "/sign-up" }
  }
}

// 各種錯誤情況
const ERROR_RESPONSES = {
  NOT_FOUND: {
    code: 'NOT_FOUND',
    message: "This shared folder could not be found"
  },
  INACTIVE: {
    code: 'INACTIVE', 
    message: "This folder is no longer publicly shared"
  },
  TEAM_ONLY: {
    code: 'TEAM_ONLY',
    message: "This folder is only available to team members"
  },
  FOLDER_DELETED: {
    code: 'FOLDER_DELETED',
    message: "This folder has been deleted"
  }
};
```

### 3.3 ShareToken 生命週期管理

#### Token 生成策略
```typescript
import { randomUUID } from 'crypto';

// ShareToken 生成時機：開啟 Share Dialog 時
// Node.js 18+ 內建支援，Next.js 14 環境完全相容
const generateShareToken = (): string => {
  try {
    return randomUUID(); // e.g., "f35b1722-b9c8-4972-8ce5-5cc05e65348d"
  } catch (error) {
    // Fallback: 使用時間戳 + 隨機數 (適用於舊環境)
    console.warn('crypto.randomUUID() not available, using fallback');
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }
};

// Dialog 開啟時的初始化邏輯
const initializeShareDialog = async (folderId: string, userId: string) => {
  const existing = await adminDb
    .collection('folder_shares')
    .where('folderId', '==', folderId)
    .where('userId', '==', userId)
    .limit(1)
    .get();
    
  if (existing.empty) {
    // 首次開啟，立即生成 token 但設為 inactive
    const shareToken = generateShareToken();
    await adminDb.collection('folder_shares').add({
      folderId, userId, shareToken,
      shareType: 'none',
      isActive: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
    return { shareStatus: 'none', shareToken };
  } else {
    // 返回現有狀態和 token
    const data = existing.docs[0].data();
    return { 
      shareStatus: data.isActive ? data.shareType : 'none',
      shareToken: data.shareToken 
    };
  }
};
```

#### 狀態轉換邏輯 (修正版)
| 當前狀態 | 目標狀態 | 操作 | Token 狀態 | 說明 |
|----------|----------|------|-------------|------|
| none (首次) | public | 創建記錄，生成 token | 新生成 | Dialog 開啟時生成 |
| none (曾經有過) | public | 更新 `isActive: true` | 重用現有 | 恢復之前的 token |
| public | none | 設定 `isActive: false` | 保留 | 永久綁定原則 |
| public | team | 更新 `shareType: 'team'` | 保留 | 預留未來功能 |
| team | public | 更新 `shareType: 'public'` | 保留 | 預留未來功能 |
| team | none | 設定 `isActive: false` | 保留 | 預留未來功能 |

**永久綁定核心邏輯**:
1. 每個 folder 的 shareToken 一旦生成就永久不變
2. 停用分享只是設定 `isActive: false`，不刪除記錄
3. 重新啟用分享時重用相同的 shareToken

---

## 4. 前端技術規格

### 4.1 組件架構

#### FolderShareDialog 組件
**檔案**: `src/components/folder/FolderShareDialog.tsx`

```typescript
interface FolderShareDialogProps {
  folder: Folder;
  isOpen: boolean;
  onClose: () => void;
}

interface ShareState {
  shareStatus: 'none' | 'team' | 'public';
  shareToken: string | null;
  isLoading: boolean;
}
```

#### Hook 設計: useFolderSharing
**檔案**: `src/hooks/folder/useFolderSharing.ts`

```typescript
interface UseFolderSharingReturn {
  shareStatus: 'none' | 'team' | 'public';
  shareToken: string | null;
  isLoading: boolean;
  updateShareStatus: (newStatus: string) => Promise<void>;
  loadShareStatus: () => Promise<void>;
  copyShareLink: () => Promise<boolean>;
}

export const useFolderSharing = (folderId: string): UseFolderSharingReturn
```

### 4.2 狀態管理整合

#### Zustand Store 擴展
**檔案**: `src/stores/sidebar/index.ts`

```typescript
// 新增 sidebar 狀態
interface SidebarState {
  // 現有狀態...
  openShareDialog: string | null; // 當前開啟分享 dialog 的 folderId
}

// 新增操作
interface SidebarActions {
  // 現有操作...
  setOpenShareDialog: (folderId: string | null) => void;
}
```

### 4.3 路由設計

#### 公開檢視頁面
**檔案**: `src/app/shared/folder/[shareToken]/page.tsx`

```typescript
interface PageProps {
  params: { shareToken: string };
}

// Server Component 實作，支援 SEO
export default async function PublicFolderPage({ params }: PageProps) {
  // 使用 fetch 直接呼叫 API
  // 實作 loading 和錯誤狀態
  // 渲染公開內容或失效訊息
}
```

---

## 5. 安全與權限設計

### 5.1 權限檢查邏輯

#### API 層權限驗證
```typescript
// 分享管理權限 (僅限 folder 擁有者)
const canManageFolderSharing = async (folderId: string, userId: string): Promise<boolean> => {
  const folderDoc = await adminDb.collection('folders').doc(folderId).get();
  if (!folderDoc.exists) return false;
  
  // 只有 folder 擁有者可以管理分享
  return folderDoc.data()?.userId === userId;
};

// 公開訪問驗證 (無需登入，任何人可訪問)
const validatePublicAccess = async (shareToken: string): Promise<{
  isValid: boolean;
  folderId?: string;
  userId?: string;
}> => {
  const shareQuery = await adminDb
    .collection('folder_shares')
    .where('shareToken', '==', shareToken)
    .where('isActive', '==', true)
    .where('shareType', '==', 'public')
    .limit(1)
    .get();
    
  if (shareQuery.empty) {
    return { isValid: false };
  }
  
  const shareData = shareQuery.docs[0].data();
  return {
    isValid: true,
    folderId: shareData.folderId,
    userId: shareData.userId
  };
};
```

### 5.2 Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // folder_shares: 只有創建者可管理
    match /folder_shares/{shareId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // folders: 維持現有規則 (只有擁有者可存取)
    match /folders/{folderId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // prompts: 維持現有規則 (只有擁有者可存取)  
    match /prompts/{promptId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

**重要說明**:
- 公開分享**不需要**特殊的 Security Rules
- 所有公開訪問都透過 Admin SDK 在 API route 中處理
- Admin SDK 可以繞過 Security Rules，安全地讀取數據
- 這種設計保持了原有權限系統的完整性

### 5.3 安全考量

#### ShareToken 安全性
- 使用 `crypto.randomUUID()` 生成，128-bit 隨機性
- 不可預測，難以暴力破解
- 永久綁定，避免 token 洩漏風險

#### 公開頁面資料過濾
```typescript
// 只返回必要的公開資訊
const publicFolderData = {
  name: folder.name,
  description: folder.description
  // 不包含: userId, createdAt, promptSpaceId 等敏感資訊
};

const publicPromptData = prompts.map(prompt => ({
  id: prompt.id,
  name: prompt.name,
  content: prompt.content,
  shortcut: prompt.shortcut
  // 不包含: userId, folderId, seqNo 等內部資訊
}));
```

### 5.4 Folder Sharing 權限管理設計

基於現有權限系統的 folder sharing 權限規則：

#### 權限層級定義
```typescript
interface FolderSharingPermissions {
  // 管理分享權限
  canManageSharing: boolean;  // 只有 folder 擁有者
  
  // 查看權限 (公開分享)
  canViewPublicFolder: boolean;  // 任何人，包括未登入用戶
}

const getFolderSharingPermissions = async (
  folderId: string, 
  currentUserId?: string  // 可能為空 (未登入用戶)
): Promise<FolderSharingPermissions> => {
  // 1. 如果是公開分享，任何人都可以查看
  const canViewPublicFolder = true;  // 透過 shareToken 驗證
  
  // 2. 管理權限只有 folder 擁有者才有
  let canManageSharing = false;
  if (currentUserId) {
    const folderDoc = await adminDb.collection('folders').doc(folderId).get();
    canManageSharing = folderDoc.exists && folderDoc.data()?.userId === currentUserId;
  }
  
  return { canManageSharing, canViewPublicFolder };
};
```

#### 與現有 Space 權限系統的關係
```typescript
// 現有的 Space 權限不影響 Folder 公開分享
const spacePermissions = {
  owner: ['read', 'write', 'share', 'delete'],  // Space 層級
  edit: ['read', 'write'],                      // Space 層級  
  view: ['read']                                // Space 層級
};

// Folder 分享是獨立的權限邏輯
const folderSharingPermissions = {
  // 只有 folder.userId === currentUserId 可以管理分享
  canManage: folder.userId === currentUserId,
  
  // 公開分享任何人都可以查看 (透過 shareToken)
  canViewPublic: true
};
```

#### 權限檢查時機
1. **FolderItem DropdownMenu**: 顯示 "Share" 選項前檢查 `canManageSharing`
2. **API 分享管理**: 所有分享操作前驗證 folder 擁有權
3. **公開訪問**: 只驗證 shareToken 有效性，無需用戶權限

---

## 6. 實作步驟與時程

### Phase 1: 後端基礎架構 (1-2天)
1. **建立 Firestore Collection**
   - 創建 `folder_shares` collection
   - 設定 Security Rules
   - 準備複合索引

2. **API 端點實作**
   - `POST /api/v1/folders/[folderId]/shares` - 分享管理
   - `GET /api/v1/folders/[folderId]/shares` - 狀態查詢
   - `DELETE /api/v1/folders/[folderId]/shares` - 停用分享

### Phase 2: 公開訪問 API (1天)
1. **公開端點實作**
   - `GET /api/v1/shared/folder/[shareToken]` - 公開訪問
   - ShareToken 驗證邏輯
   - 資料過濾和安全檢查

### Phase 3: 前端核心組件 (2天)
1. **FolderItem 擴展**
   - DropdownMenu 新增 Share 選項
   - 權限檢查整合
   - 事件處理

2. **FolderShareDialog 組件**
   - 三選項 RadioGroup 設計
   - 公開連結顯示與複製
   - Loading 和錯誤狀態處理

3. **useFolderSharing Hook**
   - API 呼叫封裝
   - 狀態管理
   - 錯誤處理

### Phase 4: 公開檢視頁面 (1天)
1. **路由頁面**
   - `/shared/folder/[shareToken]` 實作
   - SSR 友善設計
   - SEO 優化

2. **錯誤處理頁面**
   - 失效分享的友善提示
   - CTA 引導註冊
   - 響應式設計

### Phase 5: 整合測試與優化 (1天)
1. **功能測試**
   - 分享狀態切換完整流程
   - 公開連結訪問測試
   - 權限邊界測試

2. **安全測試**
   - ShareToken 驗證
   - 權限檢查
   - 資料洩漏防護

---

## 7. 技術實作細節

### 7.1 ShareToken 管理策略

#### Token 生成
```typescript
// 在 folder_shares API 中
import { randomUUID } from 'crypto';

const createFolderShare = async (folderId: string, userId: string, shareType: string) => {
  const shareToken = randomUUID();
  
  const shareData = {
    folderId,
    userId,
    shareToken,
    shareType,
    isActive: shareType !== 'none',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  };
  
  await adminDb.collection('folder_shares').add(shareData);
  return { shareToken, shareType, isActive: shareData.isActive };
};
```

#### Token 查詢優化
```typescript
// 通過 shareToken 快速查詢
const findByShareToken = async (shareToken: string) => {
  const shareQuery = await adminDb
    .collection('folder_shares')
    .where('shareToken', '==', shareToken)
    .where('isActive', '==', true)
    .limit(1)
    .get();
    
  return shareQuery.empty ? null : shareQuery.docs[0];
};
```

### 7.2 權限整合

#### Folder Sharing 權限整合
```typescript
// 簡化的權限檢查：只有 folder 擁有者可以管理分享
const checkFolderSharingPermission = async (folderId: string, userId: string): Promise<boolean> => {
  const folderDoc = await adminDb.collection('folders').doc(folderId).get();
  if (!folderDoc.exists) return false;
  
  // 只檢查直接擁有權，不考慮 space sharing
  return folderDoc.data()?.userId === userId;
};

// 公開分享訪問不需要權限檢查
const getPublicFolderAccess = async (shareToken: string) => {
  const shareQuery = await adminDb
    .collection('folder_shares')
    .where('shareToken', '==', shareToken)
    .where('isActive', '==', true)
    .where('shareType', '==', 'public')
    .limit(1)
    .get();
    
  return !shareQuery.empty ? shareQuery.docs[0].data() : null;
};
```

### 7.3 資料查詢優化

#### 公開頁面資料獲取
```typescript
// 優化的資料查詢 (參考現有 folders API 模式)
const getPublicFolderData = async (shareToken: string) => {
  // 1. 驗證 shareToken
  const shareDoc = await findByShareToken(shareToken);
  if (!shareDoc || shareDoc.data().shareType !== 'public') {
    return { available: false };
  }
  
  const shareData = shareDoc.data();
  
  // 2. 並行查詢 folder 和 prompts
  const [folderDoc, promptsSnapshot] = await Promise.all([
    adminDb.collection('folders').doc(shareData.folderId).get(),
    adminDb.collection('prompts')
      .where('folderId', '==', shareData.folderId)
      .where('userId', '==', shareData.userId)
      .orderBy('seqNo', 'asc')
      .select('name', 'content', 'shortcut') // 只查詢需要的欄位
      .get()
  ]);
  
  // 3. 返回過濾後的公開資料
  return {
    available: true,
    folder: {
      name: folderDoc.data()?.name,
      description: folderDoc.data()?.description
    },
    prompts: promptsSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      content: doc.data().content,
      shortcut: doc.data().shortcut
    }))
  };
};
```

---

## 8. 測試策略

### 8.1 功能測試案例

#### 分享狀態切換測試
```typescript
describe('Folder Sharing State Transitions', () => {
  test('none → public: 應該生成 shareToken 並啟用分享', async () => {
    // 測試邏輯
  });
  
  test('public → none: 應該保留 token 但停用分享', async () => {
    // 測試邏輯
  });
  
  test('public → team → public: 應該重用相同 shareToken', async () => {
    // 驗證 token 穩定性
  });
});
```

#### 公開訪問測試
```typescript
describe('Public Folder Access', () => {
  test('有效 public shareToken: 應該返回 folder 內容', async () => {
    // 測試邏輯
  });
  
  test('team mode shareToken: 應該返回 not available', async () => {
    // 測試邏輯
  });
  
  test('無效 shareToken: 應該返回 not available', async () => {
    // 測試邏輯
  });
});
```

### 8.2 權限邊界測試

#### 權限檢查
- 非 folder 擁有者無法管理分享
- 只有 folder.userId === currentUserId 可以創建/管理分享
- 公開 shareToken 任何人都可以訪問（包括未登入用戶）

#### 安全測試
- ShareToken 暴力破解測試
- 敏感資料洩漏檢查
- CORS 和 headers 安全性驗證

### 8.3 用戶體驗測試

#### 分享流程測試
1. 點擊 Share 選項開啟 Dialog
2. 選擇 Public，生成並顯示分享連結
3. Copy 按鈕正常工作
4. 切換回 None，連結失效

#### 公開頁面體驗
1. 有效連結正常顯示內容
2. 失效連結顯示友善訊息
3. CTA 按鈕正確引導到註冊頁

---

## 9. 技術約束與考量

### 9.1 環境需求與相容性
- **Node.js 版本**: 18+ (支援 crypto.randomUUID())
- **Next.js 版本**: 14+ (當前專案版本)
- **ShareToken 生成**: 優先使用 crypto.randomUUID()，提供 fallback 方案
- **瀏覽器相容性**: 公開頁面支援所有現代瀏覽器

### 9.2 Firebase 配額優化
- 使用 `select()` 查詢減少頻寬用量
- 適當的索引設計避免全表掃描
- 批次操作減少 API 呼叫次數

### 9.3 效能考量
- ShareToken 查詢使用單一欄位索引，速度快
- 公開頁面支援 SSR，提升首次載入速度
- React.memo 優化 FolderItem 渲染效能

### 9.4 擴展性設計
- `shareType` 欄位預留 'team' 選項
- API 結構支援未來權限擴展
- UI 組件設計考慮未來功能

---

## 10. 驗收標準

### 10.1 功能驗收
- [ ] FolderItem 顯示 Share 選項（僅 edit 權限用戶）
- [ ] Share Dialog 正確顯示三個選項
- [ ] Public 模式生成有效分享連結
- [ ] None 模式停用分享並隱藏連結
- [ ] Copy 按鈕正常複製連結

### 10.2 公開頁面驗收
- [ ] 有效 shareToken 正確顯示 folder 內容
- [ ] 失效 shareToken 顯示 "not available" 訊息
- [ ] CTA 按鈕正確導向註冊頁面
- [ ] 響應式設計在各裝置正常顯示

### 10.3 安全驗收
- [ ] 非 folder 擁有者無法看到 Share 選項
- [ ] 公開頁面不洩漏敏感資訊
- [ ] ShareToken 無法被猜測或枚舉
- [ ] 停用的分享連結立即失效

### 10.4 效能驗收
- [ ] 分享狀態切換響應時間 < 500ms
- [ ] 公開頁面載入時間 < 2s
- [ ] FolderItem 渲染不受分享功能影響

---

## 11. 後續擴展規劃

### 11.1 Team Only 功能
- 實作 space member 權限檢查
- 登入用戶才能訪問 team shared folders
- 整合現有 space sharing 邏輯

### 11.2 進階分享功能
- 分享統計（檢視次數、訪客數）
- 分享連結自訂別名
- 批次分享多個 folders

### 11.3 社交分享整合
- 一鍵分享到 Twitter、LinkedIn
- Open Graph meta tags 優化
- 分享預覽圖生成

---

## 12. 常見問題與解答

### Q1: 為什麼 ShareToken 要永久綁定 folder？
**A**: 為了提供穩定的分享體驗。用戶分享連結後，即使暫時停用分享，重新啟用時仍使用相同連結，避免需要重新分享。

### Q2: 公開分享如何避免 Firestore Security Rules 限制？
**A**: 所有公開訪問都透過 Admin SDK 在 API route 中處理。Admin SDK 具有完整權限，可以安全地讀取資料而不受 Security Rules 限制。

### Q3: 為什麼只有 folder 擁有者可以管理分享，而不是 space edit 用戶？
**A**: 為了保持簡潔的權限模型。Folder sharing 是資料層級的權限，只有資料擁有者才能決定是否公開分享，避免權限複雜化。

### Q4: Team Only 功能什麼時候實作？
**A**: 目前預留接口但不實作。未來需要時，只需要：
1. 移除 disabled 狀態
2. 實作 team member 檢查邏輯
3. 在公開訪問 API 中加入登入驗證

### Q5: ShareToken 安全性如何保證？
**A**: 使用 Node.js 內建的 `crypto.randomUUID()` 生成，提供 128-bit 隨機性，幾乎不可能被猜測。即使知道一個 token，也無法推算出其他 token。專案運行在 Node.js 18+ 環境，完全支援此功能。

### Q6: 公開頁面會暴露哪些資訊？
**A**: 只返回必要的公開資訊：
- Folder: name, description
- Prompts: id, name, content, shortcut
- 不包含: userId, createdAt, promptSpaceId, seqNo 等內部資訊

---

**備註**: 本規格文件基於 PromptBear 現有架構設計，完全相容於現有的 Firebase、Next.js 14、Zustand 技術棧，確保功能實作的一致性和可維護性。所有修正都基於實際討論的 7 個問題點，提供清晰且可執行的技術方案。