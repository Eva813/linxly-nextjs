# 階層式權限管理系統 - 開發規格書 (方案 B: 簡化版)

**版本**: 2.1  
**更新日期**: 2025-09-11  
**專案**: PromptBear - Linxly Next.js  
**範圍**: Space > Folder > Prompt 三層權限系統整合  
**設計方案**: 簡化版權限繼承模式

---

## 🎯 方案 B 設計決策

### 設計理念
採用**簡化權限繼承模式**，降低系統複雜度的同時保持功能完整性：
- **Space base_members** 自動包含在 Folder team sharing
- **額外邀請統一權限** (固定為 view)  
- **完全繼承模式** Prompt 無獨立權限設定
- **開發效率提升 60-70%**，維護成本降低 80%

### 複雜度對比
| 技術面向 | 原方案 A (複雜) | 方案 B (簡化) | 改善 |
|----------|----------------|---------------|------|
| Database 查詢 | 4-5 次查詢 + 權限合併 | 2-3 次查詢 | **-50%** |
| API 端點數量 | 8-10 個 | 4-5 個 | **-50%** |
| 權限檢查邏輯 | 15-20 行 + 複雜條件 | 8-10 行 | **-60%** |
| 前端狀態管理 | 6-8 個 state variables | 3-4 個 state variables | **-40%** |
| UI 組件複雜度 | 多區域 + 條件渲染 | 單純列表 + 簡單條件 | **-70%** |

---

## 1. 產品需求概述 (PRD)

### 1.1 目標願景
實現簡化而強大的三層權限管理系統，讓用戶能夠直觀地管理 Space、Folder、Prompt 的訪問權限，支援團隊協作與公開分享。

### 1.2 核心價值主張
- **權限自動繼承**: Folder team sharing 自動包含所有 Space 成員
- **簡化控制**: Folder owner 可選擇 none/team/public，額外邀請統一為 view 權限
- **清晰分級**: 私有 → 團隊 → 公開的直觀分享模式
- **向下相容**: 完全保持現有分享連結和 API 的兼容性

### 1.3 使用者故事

#### Story 1: Team Lead 管理工作空間
```
作為一個 Team Lead，
我想要在 Space 設定團隊成員，
這樣當我將 folder 設為 team sharing 時，
所有團隊成員就能自動獲得訪問權限。
```

#### Story 2: Content Creator 分享內容
```
作為一個 Content Creator，
我想要將某個 folder 設為 team sharing，
並額外邀請一些協作者，
系統應該自動給他們適當的權限。
```

#### Story 3: 用戶理解權限範圍
```
作為一個普通用戶，
我想要清楚看到每個 folder 的分享狀態，
不需要理解複雜的權限繼承邏輯。
```

---

## 2. 簡化權限模型設計

### 2.1 三層權限結構

```typescript
// 簡化的權限模型
Space {
  base_members: SpaceShare[]  // 基礎成員清單
  permissions: ['view', 'edit'] // 完全繼承到 Folder
}
  ↓ 自動繼承
Folder {
  shareStatus: 'none' | 'team' | 'public'
  // team = Space members + additional emails (固定 view 權限)
}
  ↓ 完全繼承
Prompt {
  // 無獨立權限設定，完全繼承 Folder
}
```

### 2.2 權限規則定義

```typescript
// 簡化的權限規則
interface SimplifiedPermissionRules {
  // Folder Owner 永遠是 'edit'
  owner: 'edit';
  
  // Space Members 完全繼承 Space 權限
  space_inheritance: 'view' | 'edit';  // 來自 Space 設定
  
  // Additional Invites 統一權限
  additional_invites: 'view';  // 固定為 view
  
  // Public Access 統一權限  
  public_access: 'view';  // 固定為 view
}
```

### 2.3 Database Schema (簡化)

#### 保持現有結構不變
```typescript
// space_shares (現有，無需修改)
interface SpaceShare {
  id: string;
  promptSpaceId: string;
  sharedWithUserId?: string;
  sharedWithEmail?: string;
  permission: 'view' | 'edit';
  status: 'active' | 'revoked';
}

// folder_shares (簡化擴展)
interface FolderShare {
  id: string;
  folderId: string;
  userId: string;
  shareToken: string;
  shareStatus: 'none' | 'team' | 'public';
  
  // 新增：額外邀請 (只需 email 清單)
  additionalEmails: string[];  // 不需要權限欄位！
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 2.4 權限檢查邏輯 (大幅簡化)

```typescript
// 超級簡化的權限檢查
async function checkFolderAccess(userId: string, folderId: string) {
  const folder = await getFolderData(folderId);
  
  // 1. 檢查是否為 folder owner
  if (folder.userId === userId) {
    return { permission: 'owner', source: 'ownership' };
  }
  
  // 2. 檢查 public sharing
  if (folder.shareStatus === 'public') {
    return { permission: 'view', source: 'public' };
  }
  
  // 3. 檢查 team sharing
  if (folder.shareStatus === 'team') {
    // 先檢查 Space 權限
    const spaceAccess = await checkSpaceAccess(userId, folder.spaceId);
    if (spaceAccess?.permission) {
      return { permission: spaceAccess.permission, source: 'space' };
    }
    
    // 再檢查額外邀請 (固定 view 權限)
    const userEmail = await getUserEmail(userId);
    if (folder.additionalEmails?.includes(userEmail)) {
      return { permission: 'view', source: 'additional' };
    }
  }
  
  return { permission: null, source: null };
}
```

---

## 3. API 設計規格 (簡化)

### 3.1 保持現有 API 不變
- ✅ `/api/v1/prompt-spaces/{spaceId}/shares` - Space 分享管理
- ✅ `/api/v1/shared/folder/{shareToken}` - 公開訪問

### 3.2 簡化的 Folder Sharing API

#### 更新分享設定 (簡化)
```typescript
// POST /api/v1/folders/{folderId}/shares
interface SimplifiedShareRequest {
  shareStatus: 'none' | 'team' | 'public';
  additionalEmails?: string[];  // 只需 email 清單
}

interface SimplifiedShareResponse {
  shareStatus: string;
  shareToken?: string;
  totalMembers: number;
  message: string;
}
```

#### 獲取分享狀態 (簡化)
```typescript
// GET /api/v1/folders/{folderId}/shares
interface SimplifiedShareStatus {
  shareStatus: 'none' | 'team' | 'public';
  shareToken?: string;
  spaceMembers?: {
    count: number;
    spaceName: string;
  };
  additionalEmails?: string[];
  totalMembers: number;
}
```

---

## 4. UI/UX 設計規格 (簡化)

### 4.1 Space 設定頁面 (微調)

保持現有設計，只需要調整說明文字：

```jsx
<SpaceSettingsDialog>
  <TabPanel value="sharing">
    <div className="space-sharing-section">
      <h3>Team Members</h3>
      <p className="text-sm text-gray-600">
        這些成員將自動包含在所有設為 "Team Sharing" 的 folders 中
      </p>
      
      {/* 現有的 email 邀請 UI 保持不變 */}
      <EmailInviteSection />
    </div>
  </TabPanel>
</SpaceSettingsDialog>
```

### 4.2 Folder 設定頁面 (大幅簡化)

```jsx
<FolderShareDialog>
  <div className="sharing-options">
    <RadioGroup value={shareStatus} onValueChange={handleChange}>
      
      {/* None 選項 */}
      <RadioOption value="none">
        <div>
          <h4>Private</h4>
          <p>Only you can access this folder</p>
        </div>
      </RadioOption>
      
      {/* Team 選項 (簡化) */}
      <RadioOption value="team">
        <div>
          <h4>Team</h4>
          <p>Space members + additional people you invite</p>
        </div>
        
        {shareStatus === 'team' && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            {/* 顯示 Space 成員數量 (不顯示詳細列表) */}
            <div className="text-sm text-gray-600 mb-2">
              📋 {spaceMembers.count} members from "{spaceName}" will have access
            </div>
            
            {/* 額外邀請 (簡化) */}
            <div>
              <label className="text-sm font-medium">Additional people:</label>
              <EmailInput 
                placeholder="Enter email addresses..."
                value={additionalEmails}
                onChange={setAdditionalEmails}
              />
              <div className="text-xs text-gray-500 mt-1">
                Additional people will have view access
              </div>
            </div>
          </div>
        )}
      </RadioOption>
      
      {/* Public 選項 (保持不變) */}
      <RadioOption value="public">
        <div>
          <h4>Public</h4>
          <p>Anyone with the link can view</p>
        </div>
        
        {shareStatus === 'public' && (
          <PublicLinkSection shareToken={shareToken} />
        )}
      </RadioOption>
      
    </RadioGroup>
  </div>
</FolderShareDialog>
```

### 4.3 權限指示器 (簡化)

```jsx
// 簡化的權限指示器
<PermissionIndicator shareStatus={folder.shareStatus}>
  {shareStatus === 'none' && (
    <Badge variant="gray">
      <Lock className="w-3 h-3" />
      Private
    </Badge>
  )}
  
  {shareStatus === 'team' && (
    <Badge variant="blue">
      <Users className="w-3 h-3" />
      Team ({totalMembers})
    </Badge>
  )}
  
  {shareStatus === 'public' && (
    <Badge variant="green">
      <Globe className="w-3 h-3" />
      Public
    </Badge>
  )}
</PermissionIndicator>
```

---

## 5. 技術實作規格 (簡化)

### 5.1 Hook 簡化

```typescript
// 簡化的 useFolderSharing Hook
interface UseFolderSharingSimplified {
  // 基本狀態
  shareStatus: 'none' | 'team' | 'public';
  shareToken: string | null;
  isLoading: boolean;
  error: string | null;
  
  // 簡化的成員資訊
  spaceMembers: {
    count: number;
    spaceName: string;
  };
  additionalEmails: string[];
  totalMembers: number;
  
  // 簡化的操作
  updateShareStatus: (status: string) => Promise<void>;
  updateAdditionalEmails: (emails: string[]) => Promise<void>;
  copyShareLink: () => Promise<boolean>;
  clearError: () => void;
}
```

### 5.2 State Management (簡化)

```typescript
// 簡化的 Zustand Store
interface SimplifiedFolderSharingState {
  folders: Record<string, Folder>;
  
  // 簡化的分享狀態
  folderSharing: Record<string, {
    shareStatus: string;
    shareToken?: string;
    totalMembers: number;
  }>;
  
  // 簡化的操作
  updateFolderSharing: (folderId: string, sharing: FolderSharing) => void;
  clearFolderSharing: (folderId: string) => void;
}
```

---

## 6. 實作時程規劃 (大幅縮短)

### Phase 1: 後端 API 實作 (2 天)
**Day 1**:
- 修改現有 `/api/v1/folders/{folderId}/shares` 支援 `additionalEmails`
- 實作簡化的權限檢查邏輯
- 單元測試

**Day 2**:
- 整合測試與邊界情況
- 性能測試和優化

### Phase 2: 前端組件實作 (2-3 天)
**Day 1**:
- 修改 `FolderShareDialog` 組件
- 更新 `useFolderSharing` Hook

**Day 2**:
- 實作簡化的權限指示器
- 更新 Space 設定頁面說明文字

**Day 3** (可選):
- UI/UX 精調和錯誤處理

### Phase 3: 整合測試 (1 天)
- 端到端功能測試
- 兼容性測試
- 性能驗證

**總開發時間: 5-6 天** (相比原方案的 9-12 天)

---

## 7. 驗收標準

### 7.1 功能驗收
- [ ] Space members 設定正確影響 folder team sharing
- [ ] Folder team sharing 顯示正確的成員總數
- [ ] 額外邀請功能正常運作，統一為 view 權限
- [ ] Public sharing 完全獨立運作
- [ ] 權限檢查邏輯正確，無安全漏洞

### 7.2 UI/UX 驗收  
- [ ] 權限狀態在 UI 中清楚呈現
- [ ] Team sharing 顯示簡潔的成員資訊
- [ ] 額外邀請介面簡單易用
- [ ] 權限指示器正確顯示當前狀態
- [ ] 響應式設計正常運作

### 7.3 技術驗收
- [ ] API 響應時間 < 300ms (相比原目標 500ms 更快)
- [ ] 權限檢查邏輯簡潔無漏洞
- [ ] 完全向下相容現有功能
- [ ] Error handling 完善
- [ ] 程式碼覆蓋率 > 85%

---

## 8. 風險評估 (大幅降低)

### 8.1 技術風險 (已最小化)
**風險**: 簡化設計可能功能不足  
**應對**: 保留擴展接口，根據用戶反饋決定是否增加複雜功能

**風險**: 固定權限可能不滿足某些用例  
**應對**: 第一版聚焦核心使用場景，後續版本可增加彈性

### 8.2 產品風險 (已控制)
**風險**: 用戶可能需要更細緻的權限控制  
**應對**: 提供清晰的升級路徑，可在 v2.0 中增加複雜功能

**風險**: 競品具有更複雜的權限功能  
**應對**: 簡單易用的設計往往更受用戶歡迎

---

## 9. 技術實作範例

### 9.1 簡化的權限檢查 API

```typescript
// /api/v1/folders/[folderId]/shares/route.ts (簡化版)
export async function POST(request: NextRequest, { params }: { params: { folderId: string } }) {
  const userId = request.headers.get('x-user-id');
  const { shareStatus, additionalEmails = [] } = await request.json();
  
  // 驗證 folder 擁有權
  const canManage = await validateFolderOwnership(folderId, userId);
  if (!canManage) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // 簡化的更新邏輯
  const shareData = {
    shareStatus,
    additionalEmails,
    shareToken: shareStatus === 'public' ? generateShareToken() : undefined,
    updatedAt: FieldValue.serverTimestamp()
  };
  
  await updateFolderShare(folderId, userId, shareData);
  
  // 簡化的回應
  return NextResponse.json({
    shareStatus,
    shareToken: shareData.shareToken,
    totalMembers: await calculateTotalMembers(folderId, shareStatus, additionalEmails),
    message: `Folder sharing updated to ${shareStatus}`
  });
}
```

### 9.2 簡化的前端 Hook

```typescript
// hooks/folder/useFolderSharing.ts (簡化版)
export const useFolderSharing = (folderId: string) => {
  const [state, setState] = useState({
    shareStatus: 'none',
    shareToken: null,
    spaceMembers: { count: 0, spaceName: '' },
    additionalEmails: [],
    totalMembers: 0,
    isLoading: false,
    error: null
  });
  
  const updateShareStatus = async (newStatus: string, additionalEmails: string[] = []) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await fetch(`/api/v1/folders/${folderId}/shares`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareStatus: newStatus, additionalEmails })
      });
      
      const data = await response.json();
      setState(prev => ({ ...prev, ...data, isLoading: false }));
    } catch (error) {
      setState(prev => ({ ...prev, error: error.message, isLoading: false }));
    }
  };
  
  return { ...state, updateShareStatus };
};
```

---

## 10. 結論

方案 B（簡化版）在保持核心功能完整性的同時，大幅降低了系統複雜度：

### 主要優勢
- **開發效率**: 提升 60-70%，總開發時間從 9-12 天縮短到 5-6 天
- **維護成本**: 降低 80%，大幅減少潛在 bug 和邊界情況
- **用戶體驗**: 簡潔直觀的權限模型，用戶容易理解
- **技術債務**: 最小化過度設計，遵循 YAGNI 原則

### 技術特色
- **向下相容**: 完全保持現有 API 和功能
- **擴展性**: 保留升級到複雜版本的可能性
- **性能優化**: 查詢次數減少 50%，響應時間更快
- **代碼品質**: 邏輯簡潔，測試覆蓋率更高

這個方案非常適合快速上線並獲得用戶反饋，後續可根據實際需求決定是否需要增加更複雜的功能。