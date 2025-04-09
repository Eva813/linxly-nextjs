import { useState } from "react";
import { useSnippetStore } from "@/stores/snippet";
// 注意，這邊的 tryItOutPopup 他會搭配擴充，當你輸入捷徑時，會自動替換成對應的程式碼片段(然後他是會打擴充的)
const TryItOutPopup = ({ shortcut }: { shortcut: string }) => {
  const { folders } = useSnippetStore();
  const [inputText, setInputText] = useState("");

  // 取得所有程式碼片段的捷徑
  const getAllShortcuts = () => {
    return folders
      .flatMap(folder => folder.snippets)
      .filter(snippet => snippet.shortcut)
      .map(snippet => ({
        shortcut: snippet.shortcut,
        content: snippet.content
      }))
      // 排序必要性？
      .sort((a, b) => b.shortcut.length - a.shortcut.length);
  };

  // 檢查內容是否包含特殊屬性並進行處理
  const processContent = (content: string) => {
    // 檢查是否包含 data-type 或 data-snippet 特殊屬性
    if (content.includes('data-type') || content.includes('data-snippet')) {
      try {
        // 建立一個臨時的 DOM 元素來解析 HTML 內容
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;

        // 檢查特殊屬性
        const elements = tempDiv.querySelectorAll('[data-type], [data-snippet]');

        if (elements.length > 0) {
          // 這裡可以針對不同的 data-type 和 data-snippet 進行不同處理
          // 例如：表單元素、程式碼片段等

          // 簡單示例：將所有特殊元素轉換為文字描述
          let processedContent = content;
          elements.forEach(el => {
            const dataType = el.getAttribute('data-type');
            const dataSnippet = el.getAttribute('data-snippet');

            if (dataType) {
              processedContent = processedContent.replace(
                el.outerHTML,
                `[特殊元素: ${dataType}]`
              );
            } else if (dataSnippet) {
              processedContent = processedContent.replace(
                el.outerHTML,
                `[程式碼片段: ${dataSnippet}]`
              );
            }
          });

          return processedContent;
        }
      } catch (error) {
        console.error('處理特殊內容時發生錯誤:', error);
      }
    }

    // 如果沒有特殊屬性或處理失敗，直接返回原內容
    return content;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;

    // 取得所有捷徑，依照長度排序（已在 getAllShortcuts 處理）
    const shortcuts = getAllShortcuts();

    // 找出第一個匹配的捷徑
    const matched = shortcuts.find(({ shortcut }) => newText.includes(shortcut));

    if (matched) {
      // 處理內容，檢查是否有特殊屬性
      const processedContent = processContent(matched.content);

      // 使用 replaceAll 或更保守地只替換第一次出現
      const updatedText = newText.replace(matched.shortcut, processedContent);
      setInputText(updatedText);
    } else {
      setInputText(newText);
    }
  };

  return (
    <div className="absolute top-full left-0 mt-2 w-96 p-4 bg-white border border-gray-300 shadow-lg rounded-md z-50">
      <p className="text-sm font-medium">
        在文字框中輸入任何捷徑：<span className="text-blue-500 font-bold">{shortcut}</span> 或其他
      </p>
      <textarea
        className="w-full mt-2 p-2 border border-gray-300 rounded-md"
        rows={3}
        placeholder="在此輸入任何已存在的捷徑..."
        value={inputText}
        onChange={handleInputChange}
        autoFocus
      />
      <p className="text-xs text-gray-500 mt-2">
        當輸入任何已設定的捷徑時，捷徑將直接在文字框中替換為對應的程式碼片段。此功能可在任何網站上使用。
      </p>
    </div>
  );
};

export default TryItOutPopup;