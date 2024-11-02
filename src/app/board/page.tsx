// src/app/board/page.tsx
'use client';

import dynamic from 'next/dynamic';

const FlowWithNoSSR = dynamic(
  () => import('../components/flow'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-screen flex items-center justify-center dark:bg-[#141414]">
        <div className="text-xl dark:text-white">Loading Flow Editor...</div>
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
