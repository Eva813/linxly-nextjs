# AI Code Review 工作流程

## 概述

本專案整合了多層次的 **智能 AI 代碼審查系統**，結合本地 Claude Code CLI 和 GitHub CodeQL 安全掃描，提供全面的代碼品質保障。系統能自動識別檔案類型並選擇最適合的專業 prompt 進行審查。

## 🛠️ 工具配置

### 本地工具

- **Claude Code CLI**: 智能代碼審查和建議 (支援專業 prompt)
- **ESLint**: 代碼風格和品質檢查
- **Prettier**: 代碼格式化
- **TypeScript**: 類型檢查

### 🧠 智能 Prompt 系統

- **Frontend Prompt**: 專業 React/Next.js 審查 (`.claude/commands/frontend/code-review.md`)
- **Backend Prompt**: 專業 Node.js/Firebase 審查 (`.claude/commands/backend/code-review.md`)
- **自動分類**: 根據檔案路徑智能選擇適合的 prompt

### 雲端工具

- **GitHub CodeQL**: 安全漏洞掃描
- **GitHub Actions CI**: 自動化檢查流程

## 📋 工作流程

### 1. 開發階段 (本地)

#### 即時檢查

```bash
# 查看所有可用的檢查命令
npm run review:help

# 檢查已暫存的檔案
npm run review

# 檢查所有原始碼檔案
npm run review:all

# 執行完整 CI 檢查
npm run ci
```

#### Git Hooks 自動執行

- **Pre-commit**: 自動 lint + format 修改的檔案
- **Pre-push**: TypeScript 檢查 + Build 驗證 (簡化版)

### 2. Push 階段 (本地自動) - **Fast-fail 策略**

當你執行 `git push` 時，採用專業 DevOps **快速失敗策略**：

1. 🔧 **TypeScript 類型檢查** (快速 ~10-30秒)
   - 立即發現型別錯誤，失敗率較高
   - 失敗即停，避免後續浪費時間
2. 🏗️ **專案建置驗證** (較慢 ~1-5分鐘)
   - 確保程式碼可以正常建置和部署
   - 檢測 build-time 錯誤

### AI 代碼審查 (手動執行)

AI 代碼審查改為**手動執行**，提供更靈活的使用方式：

- 🤖 **智能代碼審查**: `npm run review` (審查已暫存檔案)
- 🔍 **全面代碼審查**: `npm run review:all` (審查所有源碼檔案)
- 📋 **查看可用命令**: `npm run review:help`

```
🚀 Running professional CI checks with fast-fail strategy...

🔧 Step 1/2: TypeScript Type Check
⏰ Running type check...
✅ Type check passed!

🏗️ Step 2/2: Production Build
⏰ Running build (this may take a few minutes)...
✅ Build successful!

🎉 All checks passed! Ready to push.
💡 For AI code review, run: npm run review
📊 Summary: ✅ Type-check → ✅ Build
```

**手動 AI 代碼審查示例**:

```bash
$ npm run review

🤖 Running intelligent Claude Code Review on staged files...
📊 Found 2 staged files to review

🔍 Reviewing: src/components/NewComponent.tsx
  🎨 Using Frontend/React review prompt
  ✅ Review completed for src/components/NewComponent.tsx

🔍 Reviewing: src/app/api/v1/users/route.ts
  📊 Using Backend/API review prompt
  ✅ Review completed for src/app/api/v1/users/route.ts

🎉 All staged files reviewed successfully!
```

### 3. Pull Request 階段 (雲端自動)

當創建 PR 時，會自動執行：

1. ✅ **GitHub Actions CI**
   - ESLint 檢查
   - TypeScript 類型檢查
   - Prettier 格式檢查
   - 專案建置驗證

2. 🔒 **CodeQL Security Analysis**
   - 自動掃描安全漏洞
   - 分析 Next.js/React 特定問題
   - 結果顯示在 GitHub Security 標籤

## 🚀 快速指令參考

| 指令                 | 說明                | 使用時機          |
| -------------------- | ------------------- | ----------------- |
| `npm run review`     | Claude 檢查暫存檔案 | commit 前快速檢查 |
| `npm run review:all` | Claude 檢查所有源碼 | 重構後全面檢查    |
| `npm run ci`         | 完整 CI 檢查        | push 前本地驗證   |
| `npm run security`   | 安全檢查資訊        | 查看安全掃描狀態  |
| `npm run lint:fix`   | 自動修復 lint 問題  | 快速修復代碼問題  |

## 🔍 智能檢查重點

### 🎨 Frontend 檔案 (React/Next.js Prompt)

**適用範圍**: `src/app/*`, `src/components/*`, `src/hooks/*`, `src/stores/*`, `*.tsx`

**審查重點**:

- **Next.js 最佳實踐**: App Router, Server Components, SSR 優化
- **React 模式**: Hooks 使用, 性能優化, 狀態管理
- **TypeScript 設計**: 類型安全, 泛型使用, Props 定義
- **組件架構**: 可重用性, 組合模式, 性能優化
- **UI/UX**: 可訪問性, 響應式設計

### 📊 Backend 檔案 (Node.js/Firebase Prompt)

**適用範圍**: `src/app/api/*`, `src/server/*`, `src/middleware*`

**審查重點**:

- **API 設計**: RESTful 模式, 狀態碼, 錯誤處理
- **Firebase 最佳實踐**: Firestore 查詢, 安全規則, 事務處理
- **安全性**: 認證授權, 輸入驗證, CORS 配置
- **性能**: 查詢優化, 快取策略, 異步處理
- **錯誤處理**: 統一格式, 日誌記錄, 用戶友好訊息

### 🔧 General 檔案 (簡化審查)

**適用範圍**: `src/shared/*`, `src/types/*`, `src/utils/*`, 其他檔案

**審查重點**:

- **代碼品質**: 可讀性, 維護性
- **TypeScript**: 類型定義, 泛型設計
- **工具函數**: 純函數, 錯誤處理

### CodeQL 安全掃描

- **注入攻擊**: SQL, XSS, Command injection
- **認證問題**: JWT, Session 管理
- **API 安全**: 輸入驗證, 授權檢查
- **Next.js 特定**: API routes, SSR 安全

## ⚙️ 自訂配置

### 調整 Claude Review 範圍

編輯 `.husky/pre-push` 來自訂檢查範圍：

```bash
# 只檢查特定目錄
git diff --name-only HEAD~1 HEAD | grep "^src/components" | head -5
```

### 調整 CodeQL 設定

修改 `.github/codeql/codeql-config.yml` 來自訂掃描規則。

## 🎯 專業 DevOps 最佳實踐

### **Fast-fail 策略優勢**

1. **快速反饋**: 型別錯誤立即發現，減少等待時間
2. **資源優化**: 避免在明確會失敗時執行昂貴的 build 操作
3. **開發者體驗**: 最快 10 秒內就能發現問題，而不是等待 5 分鐘
4. **專業標準**: 符合 Google、Microsoft 等大廠的 CI/CD 實踐

### **Git Hook 分工策略**

- **Pre-commit**: 快速、基礎檢查 (lint, format)
- **Pre-push**: 核心品質檢查 (type-check → build)
- **CI**: 安全、整合檢查 (CodeQL, integration tests)
- **手動 AI 審查**: 靈活執行 (npm run review)

### **日常開發建議**

1. **使用手動 AI 審查**: 在重要變更前執行 `npm run review`
2. **重視 CodeQL 警告**: 優先修復安全相關問題
3. **信任 Fast-fail**: 早期失敗是好事，節省時間和資源
4. **靈活使用工具**: 需要時手動執行 AI 審查，日常依賴自動檢查
5. **保持工具更新**: 定期更新 Claude CLI 和 GitHub Actions

### **AI 代碼審查使用時機**

- **重要功能開發**: 實作新功能時執行全面審查
- **重構代碼**: 大幅度修改後執行審查
- **部署前檢查**: 重要版本發布前的最終檢查
- **學習目的**: 想獲得代碼改進建議時

## 🔧 故障排除

### Claude CLI 未找到

```bash
# 檢查安裝
which claude

# 如果未安裝，請安裝 Claude Code CLI
```

### CodeQL 分析失敗

1. 檢查 GitHub Actions 日誌
2. 確認專案可以正常建置
3. 檢查 `.github/codeql/codeql-config.yml` 設定

### Pre-push Hook 問題

```bash
# 重新初始化 Git hooks
npm run prepare

# 檢查 hook 權限
chmod +x .husky/pre-push
```
