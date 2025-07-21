# 權限系統應用指南

## 概述

我們建立了統一的權限管理系統，確保所有編輯功能都能正確根據用戶權限（owner/edit/view）來控制。

## 架構組成

### 1. 核心 Hooks

#### `usePromptSpacePermission`
- 提供基本的權限狀態檢查
- 位置：`/src/hooks/usePromptSpacePermission.ts`

#### `useEditableState` 
- 高階權限包裝器，包含編輯操作的權限檢查
- 位置：`/src/hooks/useEditableState.ts`

### 2. 權限感知組件
- `EditableInput` - 權限感知的輸入框
- `EditableTextarea` - 權限感知的文字區域
- `EditableWrapper` - 通用權限包裝器

## 應用方式

### 方法 1: 使用 `useEditableState` Hook

適用於需要權限控制的組件：

```typescript
import { useEditableState } from '@/hooks/useEditableState';

const MyComponent = () => {
  const { canEdit, checkEditPermission, getButtonProps } = useEditableState();

  // 在函數內部檢查權限
  const handleSave = useCallback(async () => {
    if (!canEdit) return;  // 直接檢查權限
    
    // 保存邏輯
  }, [canEdit]);

  // 直接使用 canEdit 檢查
  const handleChange = useCallback((value) => {
    if (!canEdit) return;
    
    // 變更邏輯
  }, [canEdit]);

  return (
    <div>
      {/* 直接控制輸入欄位的 disabled 狀態 */}
      <input
        value={value}
        onChange={handleChange}
        disabled={!canEdit}
        className="your-custom-classes"
      />
      
      {/* 按鈕自動應用權限 */}
      <button
        onClick={handleSave}
        {...getButtonProps('edit', {
          className: "your-button-classes"
        })}
      >
        Save
      </button>
    </div>
  );
};
```

### 方法 2: 使用權限感知組件

適用於簡單的輸入場景：

```typescript
import { EditableInput, EditableTextarea, EditableWrapper } from '@/components/ui/editableInput';

const SimpleComponent = () => {
  return (
    <EditableWrapper>
      <EditableInput
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter name"
      />
      
      <EditableTextarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Enter description"
      />
    </EditableWrapper>
  );
};
```

### 方法 3: 條件渲染

適用於需要完全隱藏某些功能的場景：

```typescript
import { usePromptSpacePermission } from '@/hooks/usePromptSpacePermission';

const ConditionalComponent = () => {
  const { canEdit, canDelete } = usePromptSpacePermission();

  return (
    <div>
      {canEdit && (
        <button onClick={handleEdit}>Edit</button>
      )}
      
      {canDelete && (
        <button onClick={handleDelete}>Delete</button>
      )}
    </div>
  );
};
```

## 需要應用權限控制的組件清單

### 🔄 已完成
- ✅ Folder 編輯頁面 (`/folder/[folderId]/page.tsx`)
  - ✅ Folder name input: `disabled={!canEdit}`
  - ✅ Description textarea: `disabled={!canEdit}`
- ✅ **Prompt Header 組件** (`/prompt/[promptId]/components/promptHeader.tsx`)
  - ✅ 名稱輸入框: `disabled={!canEdit}`
  - ✅ 快捷鍵輸入框: `disabled={!canEdit}`
- ✅ **Prompt 業務邏輯** (`/prompt/[promptId]/hooks/usePromptPageLogic.ts`)
  - ✅ 保存函數權限檢查: `if (!canEdit) return`
  - ✅ 自動保存權限檢查

### ⚠️ 待處理

#### 高優先級 - Prompt 編輯核心功能
1. **Prompt 內容編輯器**
   - TipTap 編輯器權限控制
   - 表單欄位插入功能

3. **編輯面板** (`/prompt/[promptId]/editPanel.tsx`)
   - 表單欄位屬性編輯

#### 中優先級 - 表單欄位編輯
4. **文字欄位編輯** (`/components/formTextFields.tsx`)
5. **選單欄位編輯** (`/components/formMenuFields.tsx`)
6. **基本輸入欄位** (`/components/textInputField.tsx`)

#### 低優先級 - 對話框和工具
7. **插入對話框組件**
   - `InsertTextFieldDialog.tsx`
   - `InsertDropDownMenuDialog.tsx`

8. **側邊欄功能**
   - `promptItem.tsx` (刪除功能)

## 實施檢查清單

對於每個需要權限控制的組件：

### ✅ 輸入欄位
- [ ] 添加 `useEditableState` hook
- [ ] 使用 `disabled={!canEdit}` 直接控制權限
- [ ] 測試 view 權限時的禁用狀態

### ✅ 編輯函數
- [ ] 在函數內直接檢查權限: `if (!canEdit) return`
- [ ] 確保自動保存邏輯包含權限檢查
- [ ] 測試權限不足時的行為

### ✅ 按鈕和操作
- [ ] 使用 `getButtonProps()` 或條件渲染
- [ ] 添加適當的 tooltip 說明
- [ ] 測試視覺回饋

### ✅ 用戶體驗
- [ ] 權限不足時有清楚的視覺提示
- [ ] 不會產生錯誤的 API 請求
- [ ] 保持一致的 UI 行為

## 測試場景

1. **Owner 權限**: 所有功能正常可用
2. **Edit 權限**: 可編輯，不能分享/刪除空間
3. **View 權限**: 所有編輯功能禁用，只能查看

## 權限控制最佳實踐

### 1. 輸入欄位權限控制

**推薦方式 - 直接使用 disabled**:
```typescript
const { canEdit } = useEditableState();

<input
  value={name}
  onChange={handleNameChange}
  disabled={!canEdit}
  className="your-classes"
/>
```

**優點**:
- 直觀易懂
- 瀏覽器原生支援
- 自動處理樣式和互動

### 2. 函數權限檢查

**推薦方式 - 函數內部檢查**:
```typescript
const saveData = useCallback(async () => {
  if (!canEdit) return;  // 簡單直接
  
  // 保存邏輯
}, [canEdit, ...otherDeps]);
```

**優點**:
- 邏輯清晰
- 依賴穩定
- 避免複雜的高階函數

### 3. 避免的做法

❌ **不推薦** - 使用 `getInputProps()`:
```typescript
// 已移除，過於複雜
<input {...getInputProps()} />
```

❌ **不推薦** - 高階函數包裝:
```typescript
// 會導致依賴不穩定
const wrappedSave = withEditPermission(saveFunction);
```

## 注意事項

1. **性能考量**: 直接使用 `disabled={!canEdit}` 性能最佳
2. **一致性**: 所有輸入欄位都使用 `disabled` 屬性控制
3. **用戶友好**: disabled 狀態有清楚的視覺回饋
4. **安全性**: 前端權限檢查 + 後端 API 權限驗證雙重保護


---

讓我分析一開始的設計錯誤：

  🚨 設計錯誤分析

  錯誤 1: 高階函數包裝 + useCallback 組合

  // ❌ 錯誤的設計
  const withEditPermission = useCallback(
    <T extends unknown[], R>(fn: (...args: T) => R) => {
      return (...args: T): R | void => {
        if (!canEdit) return;
        return fn(...args);
      };
    },
    [canEdit]
  );

  // ❌ 在組件中使用
  const saveFolder = withEditPermission(useCallback(async
  () => {
    // 保存邏輯
  }, [dependencies]));

  問題在於：
  1. withEditPermission 每次 canEdit 變化時都會返回新的函數
  2. 這導致 saveFolder 的引用不斷變化
  3. debouncedSave 依賴於 saveFolder，也跟著不斷重新創建
  4. useEffect 監聽到 debouncedSave 變化，又觸發新的更新
  5. 形成 無限循環

  錯誤 2: 依賴鏈條過長

  canEdit 變化 → withEditPermission 變化 → saveFolder 變化
  → debouncedSave 變化 → useEffect 觸發 → setState →
  重新渲染 → 循環

  錯誤 3: 過度抽象

  我想要讓權限檢查"完全透明"，但這種高階函數的抽象：
  - 增加了複雜度
  - 破壞了 React 的穩定性原則
  - 讓依賴關係變得不清晰

  ✅ 正確的設計原則

  原則 1: 保持簡單

  // ✅ 直接在函數內檢查權限
  const saveFolder = useCallback(async () => {
    if (!canEdit) return; // 簡單直接
    // 保存邏輯
  }, [canEdit, ...otherDeps]);

  原則 2: 穩定的依賴

  - canEdit 是布林值，變化可控
  - 避免動態創建函數作為依賴

  原則 3: 明確的權限檢查

  // ✅ 權限檢查一目了然
  if (!canEdit) return;

  // 而不是隱藏在高階函數中
  const wrappedFn = withPermission(originalFn);

  🎯 學到的教訓

  1. React 的穩定性比抽象重要 - 過度抽象會破壞 React
  的優化機制
  2. 直接勝過間接 -
  權限檢查直接寫在函數內比高階函數包裝更清晰
  3. 依賴要可控 - 避免創建會不斷變化的依賴
  4. 測試邊界條件 - 權限變化、組件重新掛載等場景要仔細測試

  這是一個典型的「聰明過頭」的設計錯誤 -
  想要讓代碼看起來很優雅，結果反而引入了複雜的 bug！