'use client';

import { ReactNode } from 'react';
import { ClientRootProvider } from './clientRootProvider';
import { NextAuthProvider } from './nextAuthProvider';
import { ThemeProvider } from './themeProvider';
import { ClientRouteHandler } from './clientRouteHandler';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ClientRootProvider>
      <NextAuthProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ClientRouteHandler>
            {children}
          </ClientRouteHandler>
        </ThemeProvider>
      </NextAuthProvider>
    </ClientRootProvider>
  );
}
