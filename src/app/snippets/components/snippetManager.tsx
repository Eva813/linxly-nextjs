'use client';
import { useState } from 'react';
import useSnippets from '@/lib/useSnippet';

export default function SnippetManager() {
  const { snippets, addSnippet, deleteSnippet } = useSnippets();
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [folders, setFolders] = useState<{ [key: string]: any[] }>({}); // 新增資料夾狀態

  const handleAdd = () => {
    if (name.trim() === '' || content.trim() === '') return;
    // 將片段添加到資料夾中
    const folderName = 'Default'; // 假設所有片段都在 "Default" 資料夾中
    setFolders((prev) => ({
      ...prev,
      [folderName]: [...(prev[folderName] || []), { id: Date.now().toString(), name, content }],
    }));
    setName('');
    setContent('');
  };

  return (
    <div className="snippet-manager">
      <h2>片段管理</h2>
      <div className="add-snippet">
        <input
          type="text"
          placeholder="片段名稱"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <textarea
          placeholder="片段內容"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        ></textarea>
        <button onClick={handleAdd}>添加片段</button>
      </div>
      <ul>
        {Object.keys(folders).map(folder => (
          <li key={folder}>
            <strong>{folder}</strong>
            <ul>
              {folders[folder].map(snippet => (
                <li key={snippet.id}>
                  <strong>{snippet.name}</strong>
                  <p>{snippet.content}</p>
                  <button onClick={() => deleteSnippet(snippet.id)}>刪除</button>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <style jsx>{`
        .snippet-manager {
          padding: 20px;
          border: 1px solid #ccc;
          border-radius: 8px;
        }
        .add-snippet input,
        .add-snippet textarea {
          display: block;
          width: 100%;
          margin-bottom: 10px;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        .add-snippet button {
          padding: 8px 16px;
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .add-snippet button:hover {
          background-color: #005bb5;
        }
        ul {
          list-style: none;
          padding: 0;
        }
        li {
          padding: 10px;
          border-bottom: 1px solid #eee;
        }
        li button {
          margin-top: 5px;
          padding: 4px 8px;
          background-color: #e00;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        li button:hover {
          background-color: #c00;
        }
      `}</style>
    </div>
  );
}
