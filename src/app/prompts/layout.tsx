"use client";
import { useContext, ReactNode, useEffect } from 'react';
import { SidebarContext } from '@/providers/clientRootProvider';
import Sidebar from '@/app/prompts/components/sidebar/sidebar';
import LoadingOverlay from "@/app/components/loadingOverlay";
import FullPageLoading from '@/app/prompts/components/fullPageLoading';

export default function PromptsLayout({ children }: { children: ReactNode }) {
  const { isOpen, toggleSidebar } = useContext(SidebarContext);

    useEffect(() => {
      const mql = window.matchMedia('(min-width: 640px)');
      const handler = (e: MediaQueryListEvent) => {
        if (e.matches && isOpen) toggleSidebar();
      };

      mql.addEventListener('change', handler);
      if (mql.matches && isOpen) toggleSidebar();

      return () => {
        mql.removeEventListener('change', handler);
      };
    }, [isOpen, toggleSidebar]);

  return (
    <FullPageLoading>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden relative">
        {/* 手機遮罩層 */}
        <div
          className={`${isOpen ? 'fixed inset-0 bg-black/40 z-40' : 'hidden'} sm:hidden`}
          onClick={toggleSidebar}
        />
        {/* 側欄：手機 overlay or 桌面 inline */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-lg transform transition-transform duration-500 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} sm:block sm:relative sm:inset-auto sm:z-auto sm:w-auto sm:transform-none`}
        >
          <Sidebar />
        </div>
        <main className="flex-1 pl-4 pt-4 pr-4 h-full relative">
          {children}
          <LoadingOverlay />
        </main>
      </div>
    </FullPageLoading>
  );
}