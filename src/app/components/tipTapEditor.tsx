'use client';

import React, { memo, useCallback, useMemo } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import { FontSize } from './fontSizeExtension';
import { useState, useEffect, useRef } from 'react';
import TipTapToolbar from './tipTapToolbar';
import { FormTextNode } from './tipTapCustomNode/FormTextNode'
import { FormMenuNode } from './tipTapCustomNode/FormMenuNode'
import { FormMenuClickHandler, FormMenuData } from '@/types/prompt'
import type { JSONContent } from '@tiptap/react';

interface TipTapEditorProps {
  value: string | JSONContent | null | undefined; // 支援 HTML 字串、JSON 格式或空值
  isRequired?: boolean;
  disabled?: boolean;
  onChange: (value: JSONContent) => void; // 改為回傳 JSON 格式
  onEditorReady: (editor: Editor) => void;
  onStartEditing?: () => void; // 開始編輯的回調
  // 當用戶點擊自訂 Node 時的回呼
  onFormTextNodeClick?: (params: {
    pos: number
    name: string
    default: string
  }) => void;
  onFormMenuNodeClick?: FormMenuClickHandler;
  onEditorClick?: () => void;
  // 檢查是否為外部更新
  isExternalUpdate?: () => boolean;
}

// 純函數：內容比較（組件外定義，避免重複創建）
const isContentEqual = (content1: JSONContent, content2: JSONContent | string): boolean => {
  return JSON.stringify(content1) === JSON.stringify(content2);
};

// 純函數：判斷是否需要保持游標位置
const shouldPreserveCursor = (editorContent: JSONContent): boolean => {
  return Boolean(editorContent?.content && editorContent.content.length > 0);
};

// 工具函數：確保內容格式有效
const getValidTipTapContent = (value: string | JSONContent | null | undefined): string | JSONContent => {
  
  // 處理空值
  if (!value) {
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: []
        }
      ]
    };
  }

  // 如果是字串 (HTML 格式)
  if (typeof value === 'string') {
    const result = value.trim() || '<p></p>';
    return result;
  }

  // 如果是物件 (JSON 格式)
  if (typeof value === 'object' && value !== null) {
    // 檢查是否為有效的 TipTap JSON 結構
    if (!value.type || value.type !== 'doc') {
      return {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: []
          }
        ]
      };
    }

    // 確保有 content 陣列
    if (!value.content || !Array.isArray(value.content)) {
      return {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: []
          }
        ]
      };
    }

    return value;
  }

  // 其他情況，返回預設結構
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: []
      }
    ]
  };
};
const TipTapEditor = memo(({
  value,
  isRequired = false,
  disabled = false,
  onChange,
  onEditorReady,
  onStartEditing,
  onFormTextNodeClick,
  onFormMenuNodeClick,
  onEditorClick,
  isExternalUpdate
}: TipTapEditorProps) => {
  const [hasError, setHasError] = useState(false);
  const [currentFontSize, setCurrentFontSize] = useState('');
  
  // 追蹤編輯器內容，避免循環更新
  const editorContentRef = useRef<JSONContent | null>(null);
  const isUserEditingRef = useRef(false);
  const resetEditingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 穩定化 isExternalUpdate 函數引用
  const stableIsExternalUpdate = useCallback(() => {
    return isExternalUpdate?.() || false;
  }, [isExternalUpdate]);

  // 確保傳給 TipTap 的內容格式正確
  const validContent = useMemo(() => {
    return getValidTipTapContent(value);
  }, [value]);

  const editor = useEditor({
    content: validContent,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const currentContent = editor.getJSON();
      
      // 避免重複觸發 onChange (比較 JSON 內容)
      if (JSON.stringify(editorContentRef.current) === JSON.stringify(currentContent)) {
        return;
      }
      
      // 更新內容參考並標記用戶正在編輯
      editorContentRef.current = currentContent;
      isUserEditingRef.current = true;
      
      // 清除之前的重置定時器
      if (resetEditingTimeoutRef.current) {
        clearTimeout(resetEditingTimeoutRef.current);
      }
      
      // 設定新的重置定時器
      resetEditingTimeoutRef.current = setTimeout(() => {
        isUserEditingRef.current = false;
      }, 1000);
      
      // 觸發編輯開始回調
      onStartEditing?.();
      
      // 立即觸發 onChange，讓上層處理 debounce
      onChange(currentContent);
      validateContent(editor.getText());
    },
    onBlur: ({ editor }) => {
      const updatedText = editor.getText();
      if (!updatedText && isRequired) {
        validateContent(updatedText);
      }
    },
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TextStyle,
      FontSize.configure({ types: ['textStyle'] }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      // 在這裡將 FormTextNode 配置 onFormTextClick
      FormTextNode.configure({
        onFormTextClick: (params: { pos: number; name: string; default: string }) => {
          onFormTextNodeClick?.(params)
        },
      }),
      FormMenuNode.configure({
        onFormMenuClick: (params: FormMenuData) => {
          onFormMenuNodeClick?.(params)
        },
      }),
    ],
  });

  const validateContent = (content: string) => {
    setHasError(!content);
  };

  const setFontSize = useCallback((size: string) => {
    setCurrentFontSize(size);
    editor?.chain().focus().setFontSize(size).run();
  }, [editor]);

  const unsetFontSize = useCallback(() => {
    setCurrentFontSize('');
    editor?.chain().focus().unsetFontSize().run();
  }, [editor]);

  // 穩定化的內容更新處理函數
  const handleContentUpdate = useCallback((
    editor: Editor,
    content: JSONContent | string,
    isExternal: boolean,
    currentContent: JSONContent
  ) => {
    if (isExternal) {
      editor.commands.setContent(content, false);
      return;
    }
    
    // 內部更新：保持游標位置
    const { from, to } = editor.state.selection;
    editor.commands.setContent(content, false);
    
    if (shouldPreserveCursor(currentContent)) {
      const timeoutId = setTimeout(() => {
        try {
          const docSize = editor.state.doc.content.size;
          const newFrom = Math.min(from, docSize);
          const newTo = Math.min(to, docSize);
          editor.commands.setTextSelection({ from: newFrom, to: newTo });
        } catch (error) {
          console.warn('無法恢復游標位置:', error);
        }
      }, 0);
      
      // 返回清理函數
      return () => clearTimeout(timeoutId);
    }
  }, []);

  useEffect(() => {
    if (!editor) return;
    
    const isExternal = stableIsExternalUpdate();
    
    // 早期返回檢查
    if (isUserEditingRef.current && !isExternal) return;
    
    const currentEditorContent = editor.getJSON();
    if (isContentEqual(currentEditorContent, validContent)) return;
    
    // 狀態更新
    if (isExternal) {
      isUserEditingRef.current = false;
    }
    editorContentRef.current = typeof validContent === 'string' ? null : validContent;
    
    // 內容更新 - 使用穩定的回調函數
    const cleanup = handleContentUpdate(editor, validContent, isExternal, currentEditorContent);
    
    // 返回清理函數（如果有的話）
    return cleanup;
  }, [validContent, editor, stableIsExternalUpdate, handleContentUpdate]);

  // 當 editor 實例創建完成時，通過 onEditorReady 傳遞給父組件
  useEffect(() => {
    if (editor) {
      // 初始化時設置 editorContentRef
      editorContentRef.current = editor.getJSON();
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  // 動態更新編輯器的可編輯狀態
  useEffect(() => {
    if (editor && editor.isEditable !== !disabled) {
      editor.setEditable(!disabled);
    }
  }, [disabled, editor]);
  
  // 清理定時器
  useEffect(() => {
    return () => {
      if (resetEditingTimeoutRef.current) {
        clearTimeout(resetEditingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`editor-container flex flex-col mb-4 ${disabled ? 'disabled' : ''}`}>
      <TipTapToolbar
        editor={editor}
        disabled={disabled}
        currentFontSize={currentFontSize}
        onSetFontSize={setFontSize}
        onUnsetFontSize={unsetFontSize}
      />

      <EditorContent
        editor={editor}
        className={`border tiptap-container overflow-y-scroll ${hasError ? 'border-red-500' : 'border-gray-300'}`}
        onClick={onEditorClick}
      />
      {hasError && <div className="text-red-500 text-sm">This field is required.</div>}
    </div>
  );
});

TipTapEditor.displayName = 'TipTapEditor';

export default TipTapEditor;
