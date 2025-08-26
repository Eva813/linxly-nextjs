# Folder Loading Debug Information

## Problem Description
當進入 folder ID `9zMlmBZPELfxdirBRxRF` 時顯示 "No prompts in the folder"，但編輯 Textarea 觸發 autoSave 後 prompts 就會顯示。

## Root Cause Analysis

### 1. Data Loading Sequence Issue
- `FullPageLoading` 初始化 spaces 和 folders
- `switchToSpace` 呼叫 `fetchFolders(spaceId, true)` 強制重新整理
- 但快取機制可能導致資料不同步

### 2. Cache Mechanism Problem
在 `folderSlice.ts` 的 `fetchFolders` 中：
```typescript
const cachedData = state.folderCache[promptSpaceId];
if (!forceRefresh && cachedData && (now - cachedData.lastFetched) < cacheDuration) {
  set({ folders: cachedData.folders, isLoading: false });
  return;
}
```

### 3. Why AutoSave Works
當編輯 Textarea 觸發 autoSave 時：
1. 呼叫 `updateFolder` 函式
2. 更新 folder 資料
3. 同步更新快取中的所有 spaces
4. 觸發重新渲染，prompts 顯示

## Applied Fixes

### 1. Added Debug Logging
- Added console logs in `fetchFolders` to track folder loading
- Added console logs in folder page to track render state

### 2. Added Fallback Loading
- Added useEffect in folder page to reload prompts if folder exists but has no prompts
- Uses current space ID to fetch prompts for specific folder

### 3. Enhanced Error Handling
- Added proper error handling for prompt fetching
- Added console error logging for debugging

## Next Steps
1. Test the fixes by navigating to the problematic folder
2. Check browser console for debug information
3. Verify that prompts load correctly on first visit
4. Remove debug logs once issue is resolved

## Files Modified
- `/src/app/prompts/folder/[folderId]/page.tsx`
- `/src/stores/prompt/slices/folderSlice.ts`