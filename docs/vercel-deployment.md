# Vercel 部署設定

## 環境變數設定

### Production Environment

```
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Preview Environment (可選)

```
NEXT_PUBLIC_APP_URL=https://your-app-git-branch.vercel.app
```

## 自動部署流程

1. 推送程式碼到 GitHub
2. Vercel 自動建構和部署
3. 環境變數自動注入
4. URL 自動生成

## 除錯步驟

如果邀請連結仍然顯示 localhost:3000：

1. 檢查 Vercel 環境變數設定
2. 重新部署專案
3. 檢查瀏覽器開發者工具的網路請求
4. 查看 Vercel 部署日誌
5. 在其他 API 路由中添加 console.log 除錯

## 注意事項

- Vercel 自動提供 HTTPS
- 分支部署會有不同的 URL
- 自訂網域需要在 Vercel 設定
