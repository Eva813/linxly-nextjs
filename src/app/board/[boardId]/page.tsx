'use client';

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';

const FlowWithNoSSR = dynamic(
  () => import('../../components/flow'),
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
  const params = useParams();
  const boardId = params?.boardId as string;
  console.log('boardId', boardId);
  return (
    <div className="w-full h-[calc(100vh-64px)] bg-white-50">
      <FlowWithNoSSR boardId={boardId as string} />
    </div>
  );
}
