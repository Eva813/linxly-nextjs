
import Sidebar from '@/app/prompts/components/sidebar/sidebar';
import { ReactNode } from 'react';
import LoadingOverlay from "@/app/components/loadingOverlay";
import FullPageLoading from '@/app/prompts/components/fullPageLoading';

export default function PromptsLayout({ children }: { children: ReactNode }) {

  return (
    <FullPageLoading>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        <Sidebar />
        <main className="flex-1 pl-4 pt-4 pr-4 h-full relative">
          {children}
          <LoadingOverlay />
        </main>
      </div>
    </FullPageLoading>
  );
}