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

適用於需要複雜邏輯控制的組件：

```typescript
import { useEditableState } from '@/hooks/useEditableState';

const MyComponent = () => {
  const { canEdit, checkEditPermission, getInputProps, getButtonProps } = useEditableState();

  // 在函數內部檢查權限
  const handleSave = useCallback(async () => {
    if (!checkEditPermission()) return;
    
    // 保存邏輯
  }, [checkEditPermission]);

  // 直接使用 canEdit 檢查
  const handleChange = useCallback((value) => {
    if (!canEdit) return;
    
    // 變更邏輯
  }, [canEdit]);

  return (
    <div>
      {/* 輸入欄位自動應用權限 */}
      <input
        value={value}
        onChange={handleChange}
        {...getInputProps({
          className: "your-custom-classes"
        })}
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

### ⚠️ 待處理

#### 高優先級 - Prompt 編輯核心功能
1. **Prompt 編輯頁面** (`/prompt/[promptId]/page.tsx`)
   - 名稱編輯
   - 快捷鍵編輯
   - 內容編輯

2. **Prompt Header 組件** (`/prompt/[promptId]/components/promptHeader.tsx`)
   - 名稱輸入框
   - 快捷鍵輸入框
   - 編輯/預覽切換

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
- [ ] 使用 `getInputProps()` 或權限感知組件
- [ ] 測試 view 權限時的禁用狀態

### ✅ 編輯函數
- [ ] 使用 `withEditPermission()` 包裝
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

## 注意事項

1. **性能考量**: `useEditableState` 使用 `useCallback` 來避免不必要的重渲染
2. **一致性**: 所有禁用狀態都使用相同的視覺樣式
3. **用戶友好**: 提供清楚的權限提示訊息
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