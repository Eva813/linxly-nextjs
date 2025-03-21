import Sidebar from '@/app/snippets/components/sidebar/sidebar';
import { ReactNode } from 'react';

export default function SnippetsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto pl-4 py-4">{children}</main>
    </div>
  )
}
