# Firestore 索引設定說明

## 必要的複合索引

為了確保 Firestore 查詢效能，需要建立以下複合索引：

### 1. Prompts 集合索引

```
集合: prompts
欄位:
- folderId (Ascending)
- userId (Ascending) 
- seqNo (Ascending)
```

### 2. 替代索引（如果需要按建立時間排序）

```
集合: prompts
欄位:
- folderId (Ascending)
- userId (Ascending)
- createdAt (Ascending)
```

## 如何建立索引

### 方法 1: 自動建立（推薦）
當您執行查詢時，Firestore 會自動提示需要建立索引，點擊連結即可自動建立。

### 方法 2: 手動建立
1. 前往 Firebase Console
2. 選擇 Firestore Database
3. 點擊「索引」標籤
4. 點擊「建立索引」
5. 輸入上述欄位設定

### 方法 3: 使用 firestore.indexes.json
在專案根目錄建立或更新 `firestore.indexes.json`：

```json
{
  "indexes": [
    {
      "collectionGroup": "prompts",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "folderId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "userId", 
          "order": "ASCENDING"
        },
        {
          "fieldPath": "seqNo",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "prompts",
      "queryScope": "COLLECTION", 
      "fields": [
        {
          "fieldPath": "folderId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt", 
          "order": "ASCENDING"
        }
      ]
    }
  ]
}
```

然後執行：
```bash
firebase deploy --only firestore:indexes
```

## 注意事項

1. **索引建立時間**: 新索引可能需要幾分鐘才能生效
2. **成本考量**: 索引會增加寫入成本，但大幅提升查詢效能
3. **維護**: 定期檢查未使用的索引並刪除以節省成本

## 查詢最佳化建議

1. **盡量使用複合索引**: 避免客戶端排序
2. **限制結果數量**: 使用 `.limit()` 避免大量資料傳輸
3. **分頁查詢**: 對於大量資料使用分頁查詢
4. **快取策略**: 適當使用 Firestore 的快取機制
