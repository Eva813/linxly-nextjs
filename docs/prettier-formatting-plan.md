# Prettier 格式化計畫

## 🎯 目標
統一整個專案的程式碼格式，提升程式碼可讀性和團隊協作效率。

## ⚠️ 當前狀況
- **需要格式化的檔案數量**: 224 個檔案
- **主要範圍**: `src/` 目錄下的所有 JS/TS/TSX/CSS 檔案
- **CI 狀態**: 暫時設置 `continue-on-error: true`，不阻止 CI 通過

## 📋 執行計畫

### Phase 1: 準備階段
- [ ] 確認所有活躍的 feature 分支都已合併到 main
- [ ] 與團隊成員溝通格式化計畫和時間安排
- [ ] 確認沒有重要的 PR 正在 review 中

### Phase 2: 執行格式化
```bash
# 1. 格式化所有檔案
npm run format

# 2. 檢查格式化結果
npm run format:check

# 3. 提交變更
git add .
git commit -m "style: format all files with Prettier

- Apply consistent code formatting across the entire codebase
- Fix 224+ files that didn't match Prettier configuration  
- Improve code readability and team collaboration

🤖 Generated with [Claude Code](https://claude.ai/code)"

# 4. 推送到 main
git push origin main
```

### Phase 3: 清理階段  
- [ ] 移除 CI 中的 `continue-on-error: true`
- [ ] 更新團隊開發指南，要求使用 Prettier
- [ ] 設置 IDE 自動格式化配置

## 🛠️ 可用命令

```bash
# 檢查需要格式化的檔案
npm run format:check

# 僅格式化源碼檔案 (較保守)
npm run format:source  

# 格式化所有檔案 (推薦在協調後執行)
npm run format

# 查看格式化相關幫助
npm run review:help
```

## 📝 注意事項

1. **時機很重要**: 在所有 feature 分支合併後執行
2. **溝通是關鍵**: 提前通知團隊成員格式化時間
3. **Git Blame**: 格式化會影響 git blame 歷史
4. **IDE 設置**: 建議統一團隊的 IDE Prettier 設置

## 🔗 相關檔案
- `.prettierrc` - Prettier 配置
- `.prettierignore` - 忽略檔案配置  
- `.github/workflows/ci.yml` - CI 配置 (line 38: 臨時 continue-on-error)
- `package.json` - 格式化命令定義

---

💡 **執行此計畫前，請確保與團隊協調並選擇合適的時機！**