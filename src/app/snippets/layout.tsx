import Sidebar from '@/app/snippets/components/sidebar/sidebar';
import { ReactNode } from 'react';

export default function SnippetsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <Sidebar />
      <main className="flex-1 pl-4 pt-4 pr-4 h-full">{children}</main>
    </div>
  )
}
