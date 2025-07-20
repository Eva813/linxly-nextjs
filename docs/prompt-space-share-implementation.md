# 實作 Prompt Space Share 功能 - 從需求到上線的完整開發紀錄

## 📋 需求背景與情境分析

### 業務需求
在現代協作環境中，用戶需要能夠分享他們的 Prompt Space 給團隊成員，實現知識共享和協作。我們的系統需要支援：

1. **多種分享方式**：個人邀請（指定 email）和通用連結分享
2. **權限控制**：View（只能查看）和 Edit（可以編輯）權限
3. **安全性**：確保只有被邀請的用戶才能訪問
4. **用戶體驗**：簡單易用的邀請流程和直觀的 UI

### 使用情境
- **情境 1**：產品經理想要與開發團隊分享 Prompt 模板
- **情境 2**：技術 Lead 需要建立團隊共享的 Prompt 庫
- **情境 3**：客戶支援團隊需要統一的回覆 Prompt 範本

## 🗄️ 資料庫設計

### 核心數據結構

#### 1. space_shares 集合
```typescript
interface SpaceShare {
  id: string;
  spaceId: string;              // 被分享的空間 ID
  ownerUserId?: string;         // 空間擁有者 ID
  createdBy?: string;           // 邀請創建者 ID
  
  // 個人邀請相關
  sharedWithUserId?: string;    // 被邀請用戶 ID
  sharedWithEmail?: string;     // 被邀請用戶 Email
  
  // 通用連結相關
  isUniversal?: boolean;        // 是否為通用邀請連結
  sourceInviteId?: string;      // 來源邀請 ID（用於追蹤）
  
  // 權限與狀態
  permission: 'view' | 'edit';
  status: 'active' | 'revoked';
  
  // 時間戳
  createdAt: Date;
  updatedAt: Date;
  acceptedAt?: Date;
  expiresAt?: Date;
}
```

#### 2. Firebase 索引設計
```javascript
// 1. 查詢用戶的分享權限
{
  collection: 'space_shares',
  fields: [
    { field: 'spaceId', order: 'ASCENDING' },
    { field: 'sharedWithUserId', order: 'ASCENDING' },
    { field: 'status', order: 'ASCENDING' }
  ]
}

// 2. 檢查 email 邀請權限
{
  collection: 'space_shares',
  fields: [
    { field: 'spaceId', order: 'ASCENDING' },
    { field: 'sharedWithEmail', order: 'ASCENDING' },
    { field: 'status', order: 'ASCENDING' }
  ]
}

// 3. 查詢通用邀請連結
{
  collection: 'space_shares',
  fields: [
    { field: 'spaceId', order: 'ASCENDING' },
    { field: 'isUniversal', order: 'ASCENDING' },
    { field: 'status', order: 'ASCENDING' }
  ]
}
```

### 設計考量

#### 雙重記錄機制
我們採用了「通用邀請連結 + 個人分享記錄」的雙重機制：
- **通用邀請連結**：`isUniversal: true`，可重複使用
- **個人分享記錄**：每個接受邀請的用戶都有獨立記錄

#### 權限繼承
- 通用連結的權限由創建時決定
- 個人記錄繼承通用連結的權限
- 支援後續權限修改

## 🚀 API 設計與實作

### 1. 邀請管理 API

#### 生成通用邀請連結
```typescript
// POST /api/v1/prompt-spaces/{spaceId}/invite
{
  permission: 'view' | 'edit'
}

// Response
{
  inviteLink: string;
  shareId: string;
  permission: string;
  expiresAt: string;
}
```

#### 個人分享管理
```typescript
// POST /api/v1/prompt-spaces/{spaceId}/shares
{
  shares: [
    { email: string, permission: 'view' | 'edit' }
  ]
}

// PUT /api/v1/prompt-spaces/{spaceId}/shares (批量更新權限)
// DELETE /api/v1/prompt-spaces/{spaceId}/shares (批量刪除)
```

### 2. 邀請處理 API

#### 邀請驗證
```typescript
// GET /api/v1/invites/{shareId}
// Response
{
  spaceId: string;
  spaceName: string;
  ownerName: string;
  permission: 'view' | 'edit';
  isUniversal: boolean;
  isValid: boolean;
  expiresAt: string;
  needsRegistration: boolean;
}
```

#### 邀請接受
```typescript
// POST /api/v1/invites/{shareId}/accept
{
  userId: string;
}

// Response
{
  success: boolean;
  spaceId: string;
  permission: string;
  redirectUrl: string;
}
```

### 3. 權限檢查邏輯

#### 核心權限驗證函數
```typescript
async function checkUserSpaceAccess(userId: string, spaceId: string) {
  // 1. 檢查是否為空間擁有者
  const spaceDoc = await adminDb.collection('prompt_spaces').doc(spaceId).get();
  if (spaceDoc.data()?.userId === userId) {
    return { canAccess: true, canEdit: true, isOwner: true };
  }
  
  // 2. 檢查分享權限
  const shareQuery = await adminDb
    .collection('space_shares')
    .where('spaceId', '==', spaceId)
    .where('sharedWithUserId', '==', userId)
    .where('status', '==', 'active')
    .limit(1)
    .get();
  
  if (!shareQuery.empty) {
    const permission = shareQuery.docs[0].data().permission;
    return { 
      canAccess: true, 
      canEdit: permission === 'edit',
      isOwner: false 
    };
  }
  
  return { canAccess: false, canEdit: false, isOwner: false };
}
```

### 4. 性能優化策略

#### 並行查詢
```typescript
// 使用 Promise.all 進行並行查詢
const [invitedUserQuery, existingShareQuery] = await Promise.all([
  // 檢查邀請權限
  adminDb.collection('space_shares')
    .where('spaceId', '==', spaceId)
    .where('sharedWithEmail', '==', userEmail)
    .get(),
  
  // 檢查現有權限
  adminDb.collection('space_shares')
    .where('spaceId', '==', spaceId)
    .where('sharedWithUserId', '==', userId)
    .get()
]);
```

#### 索引優化
- 建立複合索引加速查詢
- 使用 `limit(1)` 限制查詢結果
- 適當的查詢條件順序

## 🎨 前端實作與 UI 設計

### 1. 分享設定界面

#### 核心組件架構
```typescript
// SpaceSettingsDialog.tsx
const SpaceSettingsDialog = ({ spaceId, currentName, onClose }) => {
  const [shareRecords, setShareRecords] = useState<ShareRecord[]>([]);
  const [inviteLinks, setInviteLinks] = useState<InviteLinks>({});
  const [emailInput, setEmailInput] = useState('');
  
  // 管理分享記錄
  const handleAddEmail = () => { /* 添加邀請 email */ };
  const handleSaveSharing = () => { /* 批量保存分享設定 */ };
  
  // 管理通用連結
  const handleGenerateInviteLink = (permission) => { /* 生成邀請連結 */ };
  const handleCopyInviteLink = (permission) => { /* 複製連結 */ };
  
  return (
    <Dialog>
      {/* Email 分享區域 */}
      <EmailSharingSection />
      
      {/* 通用連結區域 */}
      <UniversalLinksSection />
    </Dialog>
  );
};
```

#### UI 狀態管理
```typescript
interface ShareRecord {
  id: string;
  email: string;
  userId?: string;
  permission: 'view' | 'edit';
  status: 'active' | 'revoked';
  createdAt: string;
  updatedAt: string;
}

interface InviteLinks {
  view?: {
    link: string;
    shareId: string;
    expiresAt: string;
  };
  edit?: {
    link: string;
    shareId: string;
    expiresAt: string;
  };
}
```

### 2. 邀請接受頁面

#### 頁面流程設計
```typescript
// InvitePage.tsx
const InvitePage = () => {
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [validationAttempted, setValidationAttempted] = useState(false);
  
  // 邀請驗證（避免重複調用）
  useEffect(() => {
    if (shareId && !inviteInfo && !validationAttempted) {
      setValidationAttempted(true);
      validateInvite();
    }
  }, [shareId, inviteInfo, validationAttempted]);
  
  return (
    <div className="invite-page">
      {loading && <LoadingState />}
      {error && <ErrorState />}
      {success && <SuccessState />}
      {inviteInfo && <InviteForm />}
    </div>
  );
};
```

### 3. 權限相關 UI 狀態

#### 不同狀況的 UI 呈現
```typescript
// 根據權限顯示不同的 UI
const renderPermissionBadge = (permission: string) => {
  return permission === 'edit' ? (
    <Badge variant="blue">
      <Edit size={16} /> Edit Access
    </Badge>
  ) : (
    <Badge variant="green">
      <Eye size={16} /> View Access
    </Badge>
  );
};

// 通用連結提示
const UniversalLinkNotice = ({ isUniversal }) => {
  if (!isUniversal) return null;
  
  return (
    <div className="notice-amber">
      <p>📧 Invitation Required</p>
      <p>This link is only for invited users. Please sign in with the email 
         address that received this invitation.</p>
    </div>
  );
};
```

## 🔧 核心功能邏輯實作

### 1. 共享空間內容訪問

#### 資料夾 API 權限檢查
```typescript
// /api/v1/folders
export async function GET(req: Request) {
  const userId = req.headers.get('x-user-id');
  const promptSpaceId = url.searchParams.get('promptSpaceId');
  
  // 檢查用戶權限
  let spaceOwnerId = userId;
  const spaceDoc = await adminDb.collection('prompt_spaces').doc(promptSpaceId).get();
  
  if (spaceDoc.data()?.userId === userId) {
    // 用戶是擁有者
    spaceOwnerId = userId;
  } else {
    // 檢查共享權限
    const shareQuery = await adminDb
      .collection('space_shares')
      .where('spaceId', '==', promptSpaceId)
      .where('sharedWithUserId', '==', userId)
      .where('status', '==', 'active')
      .limit(1)
      .get();
    
    if (shareQuery.empty) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }
    
    // 使用空間擁有者的 userId 來查詢資料
    spaceOwnerId = spaceData?.userId || userId;
  }
  
  // 使用正確的 userId 查詢資料
  const foldersSnapshot = await adminDb
    .collection('folders')
    .where('userId', '==', spaceOwnerId)
    .get();
}
```

#### Prompts API 權限檢查
```typescript
// /api/v1/prompts
export async function GET(req: Request) {
  // 類似的權限檢查邏輯
  const folderData = folderDoc.data();
  let canAccess = false;
  let promptOwnerUserId = userId;
  
  if (folderData?.userId === userId) {
    canAccess = true;
  } else {
    // 檢查共享權限
    const shareQuery = await adminDb
      .collection('space_shares')
      .where('spaceId', '==', promptSpaceId)
      .where('sharedWithUserId', '==', userId)
      .where('status', '==', 'active')
      .limit(1)
      .get();
    
    if (!shareQuery.empty) {
      canAccess = true;
      promptOwnerUserId = folderData?.userId || userId;
    }
  }
  
  if (!canAccess) {
    return NextResponse.json({ message: 'access denied' }, { status: 403 });
  }
}
```

### 2. 前端狀態管理

#### Folder Slice 優化
```typescript
// folderSlice.ts
export const createFolderSlice: StateCreator<FolderSlice> = (set, get) => ({
  fetchFolders: async (promptSpaceId?: string, forceRefresh: boolean = false) => {
    // 只有空間擁有者才創建預設資料夾
    if (folders.length === 0) {
      try {
        const defaultFolder = DEFAULT_FOLDERS[0];
        const newFolder = await createFolder({
          name: defaultFolder.name,
          description: defaultFolder.description,
          promptSpaceId: promptSpaceId,
        });
        finalFolders = [newFolder];
      } catch (error) {
        // 如果創建失敗（例如用戶沒有編輯權限），顯示空資料夾
        console.warn('Cannot create default folder, user might not have edit permissions:', error);
        finalFolders = [];
      }
    }
  }
});
```

## 🧪 測試與驗證

### 1. 功能測試場景

#### 基本功能測試
- ✅ 空間擁有者可以添加/移除分享用戶
- ✅ 可以生成 View/Edit 權限的通用連結
- ✅ 被邀請用戶可以通過連結成功加入
- ✅ 權限控制正確（View 用戶無法編輯）

#### 邊界情況測試
- ✅ 未被邀請的用戶無法通過通用連結訪問
- ✅ 過期邀請連結正確處理
- ✅ 重複邀請處理
- ✅ 空間刪除後的邀請處理

#### 性能測試
- ✅ 大量分享用戶的處理
- ✅ 並行查詢的性能優化
- ✅ 前端重新渲染優化

### 2. 安全性驗證

#### 權限驗證
```typescript
// 測試不同權限級別的訪問
const testPermissions = async () => {
  // 1. 擁有者權限
  const ownerAccess = await checkUserSpaceAccess(ownerId, spaceId);
  expect(ownerAccess.canEdit).toBe(true);
  
  // 2. Edit 權限用戶
  const editUserAccess = await checkUserSpaceAccess(editUserId, spaceId);
  expect(editUserAccess.canEdit).toBe(true);
  
  // 3. View 權限用戶
  const viewUserAccess = await checkUserSpaceAccess(viewUserId, spaceId);
  expect(viewUserAccess.canAccess).toBe(true);
  expect(viewUserAccess.canEdit).toBe(false);
  
  // 4. 無權限用戶
  const noAccessUser = await checkUserSpaceAccess(randomUserId, spaceId);
  expect(noAccessUser.canAccess).toBe(false);
};
```

## 📊 性能優化實作

### 1. 後端優化策略

#### 並行查詢優化
```typescript
// 使用 Promise.all 減少查詢時間
const [spaceDoc, shareQuery] = await Promise.all([
  adminDb.collection('prompt_spaces').doc(spaceId).get(),
  adminDb.collection('space_shares')
    .where('spaceId', '==', spaceId)
    .where('sharedWithUserId', '==', userId)
    .get()
]);
```

#### 索引優化
- 建立適當的複合索引
- 使用 `limit(1)` 限制查詢結果
- 合理的查詢條件順序

### 2. 前端優化策略

#### 避免不必要的重新渲染
```typescript
// 移除會導致重新渲染的依賴
useEffect(() => {
  if (shareId && !inviteInfo && !validationAttempted) {
    setValidationAttempted(true);
    validateInvite();
  }
}, [shareId, inviteInfo, validationAttempted]); // 避免 session 依賴
```

#### 適度使用 React Hooks
- 避免過度使用 `useCallback`、`useMemo`
- 只在必要時使用優化 hooks
- 重點關注實際性能瓶頸

## 🚨 錯誤處理與除錯

### 1. 常見錯誤類型

#### Server/Client 組件衝突
```typescript
// 錯誤：Cannot access default.then on the server
// 原因：在 async 函數中使用 signIn
const handleSignIn = async () => {
  await signIn('google'); // ❌ 錯誤用法
};

// 正確：直接調用 signIn
const handleSignIn = () => {
  signIn('google'); // ✅ 正確用法
};
```

#### 權限檢查失敗
```typescript
// 添加詳細的錯誤處理
try {
  const result = await checkUserPermission(userId, spaceId);
  if (!result.canAccess) {
    return NextResponse.json({ 
      error: 'Access denied. Please contact the space owner.' 
    }, { status: 403 });
  }
} catch (error) {
  console.error('Permission check failed:', error);
  return NextResponse.json({ 
    error: 'Internal server error' 
  }, { status: 500 });
}
```

### 2. 除錯技巧

#### API 響應監控
```typescript
// 添加請求日誌
console.log('API Request:', { method, url, userId, spaceId });
console.log('Permission Result:', { canAccess, canEdit, isOwner });
```

#### 前端狀態追蹤
```typescript
// 使用 console.log 追蹤狀態變化
useEffect(() => {
  console.log('Invite validation state:', { 
    shareId, 
    inviteInfo, 
    validationAttempted 
  });
}, [shareId, inviteInfo, validationAttempted]);
```

## 💡 最佳實踐與經驗總結

### 1. 架構設計原則
- **單一職責**：每個 API 端點只處理一個核心功能
- **權限分離**：統一的權限檢查邏輯
- **錯誤處理**：完整的錯誤處理和用戶反饋
- **性能優先**：並行查詢和適當的索引

### 2. 前端開發經驗
- **狀態管理**：避免不必要的重新渲染
- **用戶體驗**：清晰的載入狀態和錯誤提示
- **權限 UI**：根據用戶權限顯示不同的介面元素

### 3. 後端開發經驗
- **資料庫設計**：考慮未來擴展性的索引設計
- **API 設計**：RESTful 設計和一致的錯誤回應
- **安全性**：多層次的權限驗證機制

### 4. 測試策略
- **功能測試**：覆蓋所有用戶場景
- **邊界測試**：異常情況的處理
- **性能測試**：大量數據下的系統表現

## 🔮 未來改進方向

### 1. 功能擴展
- **角色管理**：支援更細粒度的權限控制
- **審核機制**：邀請需要管理員審核
- **使用統計**：分享和使用情況的統計分析

### 2. 技術優化
- **緩存策略**：Redis 緩存熱點數據
- **實時通知**：WebSocket 實時更新分享狀態
- **批次處理**：大量邀請的批次處理優化

### 3. 用戶體驗
- **mobile 適配**：完整的移動端支援
- **離線功能**：離線狀態下的基本功能
- **國際化**：多語言支援

---

## 總結

這個 Prompt Space Share 功能的實作涵蓋了從需求分析到上線的完整流程。通過合理的資料庫設計、RESTful API 架構、以及用戶友好的前端界面，我們成功實現了一個安全、高效、易用的協作分享系統。

整個開發過程中，我們特別注重：
- **安全性**：多層次的權限驗證
- **性能**：並行查詢和索引優化
- **用戶體驗**：直觀的 UI 和流暢的操作流程
- **可維護性**：清晰的代碼結構和完整的錯誤處理

這個項目展示了現代全端開發的最佳實踐，從資料庫設計到前端 UI，每個環節都經過仔細考慮和優化。