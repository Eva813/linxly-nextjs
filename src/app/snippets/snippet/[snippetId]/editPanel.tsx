import React, { useCallback } from 'react'
import { EditInfo } from '@/types/snippets'
import { FormTextFields } from '@/app/snippets/components/formTextFields'
import { FormMenuFields } from '@/app/snippets/components/formMenuFields'


interface SidebarProps {
  editInfo: EditInfo;
  onChange: (updates: { [key: string]: string | string[] | boolean }) => void;
}


export default function EditPanel({ editInfo, onChange }: SidebarProps) {
  console.log('edit', editInfo)
  // 先定義所有的 Hook（這裡 useCallback 必定會被呼叫）
  const handleChange = useCallback((updates: { [key: string]: string | string[] | boolean }) => {
    console.log('批次更新:', updates);
    onChange(updates);
  }, [onChange]);


  // 若 editInfo 為 null，就顯示一個空內容或提示，而不提前 return 前就停止 Hook 呼叫
  if (!editInfo) {
    return <div className="">No edit info available.</div>;
  }


  return (
    // overflow - y - auto flex flex - col
    <div className="">
      <h2 className="font-bold px-4 py-2">Edit Panel</h2>
      <div className='px-4 py-2'>{editInfo.type}</div>
      {editInfo.type === 'formtext' && (
        <FormTextFields editInfo={editInfo} onChange={handleChange} />
      )}

      {editInfo.type === 'formmenu' && (
        <FormMenuFields editInfo={editInfo} onChange={handleChange} />
      )}
    </div>
  );
}
