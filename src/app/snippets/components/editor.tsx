'use client';
import { useState } from 'react';
import useSnippets from '@/lib/useSnippet';

export default function Editor() {
  const { snippets } = useSnippets();
  const [text, setText] = useState('');

  const handleInsert = (content: string) => {
    // 將片段插入到當前光標位置
    const textarea = document.getElementById('editor-textarea');
    if (textarea) {
      const start = (textarea as HTMLTextAreaElement).selectionStart;
      const end = (textarea as HTMLTextAreaElement).selectionEnd;
      const newText = text.slice(0, start) + content + text.slice(end);
      setText(newText);
      // 將光標移動到插入內容後
      setTimeout(() => {
        (textarea as HTMLTextAreaElement).selectionStart = (textarea as HTMLTextAreaElement).selectionEnd = start + content.length;
        textarea.focus();
      }, 0);
    }
  };

  return (
    <div className="editor">
      <h2>編輯器</h2>
      <textarea
        id="editor-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={10}
        cols={50}
      ></textarea>
      <div className="snippets">
        <h3>插入片段</h3>
        {snippets.map(snippet => (
          <button key={snippet.id} onClick={() => handleInsert(snippet.content)}>
            {snippet.name}
          </button>
        ))}
      </div>
      <style jsx>{`
        .editor {
          margin-top: 20px;
        }
        textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        .snippets {
          margin-top: 10px;
        }
        .snippets button {
          margin-right: 5px;
          padding: 6px 12px;
          background-color: #28a745;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .snippets button:hover {
          background-color: #218838;
        }
      `}</style>
    </div>
  );
}
