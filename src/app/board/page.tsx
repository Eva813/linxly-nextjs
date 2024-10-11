// src/app/board/page.tsx
'use client';

import dynamic from 'next/dynamic';

const FlowWithNoSSR = dynamic(
  () => import('../components/flow'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-xl">Loading Flow Editor...</div>
      </div>
    )
  }
);

export default function BoardPage() {
  return (
    <div className="w-full h-screen bg-slate-50">
      <FlowWithNoSSR />
    </div>
  );
}