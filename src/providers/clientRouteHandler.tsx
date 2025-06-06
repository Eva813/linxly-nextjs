'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import LoadingBar from '@/components/LoadingBar';

export function ClientRouteHandler({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showLoading = pathname?.startsWith('/prompts') ?? false;

  return (
    <>
      <LoadingBar active={showLoading} pathname={pathname ?? ''} />
      {children}
    </>
  );
}
