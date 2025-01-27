'use client'
// index.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'

const Snippets = () => {
  const [folders, setFolders] = useState([
    {
      id: 'HplOMyf2mDqvVMdphJbt',
      name: 'My Sample Snippets',
      snippets: [
        { id: '5mJw031VPo2WxNIQyeXN', name: 'Demo - Plain text' },
        { id: '6mJw031VPo2WxNIQyeYN', name: 'Demo - Styled Text' }
      ]
    }
  ]);

  const router = useRouter();

  // 進入第一個資料夾
  useEffect(() => {
    if (folders.length > 0) {
      router.push(`/snippets/folder/${folders[0].id}`);
    }
  }, [folders, router]);

  return (
    <div>
      <h1>Snippets</h1>
      <p>Loading...</p>
    </div>
  );
};

export default Snippets;