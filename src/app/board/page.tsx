// src/app/board/page.tsx
'use client';

import dynamic from 'next/dynamic';

const FlowWithNoSSR = dynamic(
  () => import('../components/flow'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center" style={{
        background: 'var(--header-bg)'
      }}>
        <div className="text-xl dark:text-white">Loading Flow Editor...</div>
      </div>
    )
  }
);

export default function BoardPage() {
  return (
    <div className="w-full h-[calc(100vh-64px)] bg-white-50">
      <FlowWithNoSSR />
    </div>
  );
}
