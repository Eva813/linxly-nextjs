'use client';
import { createContext, useState, ReactNode } from 'react';

export const SidebarContext = createContext<{ isOpen: boolean; toggleSidebar: () => void }>({
  isOpen: false,
  toggleSidebar: () => {},
});

export default function ClientRootProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const toggleSidebar = () => setIsOpen(prev => !prev);

  return (
    <SidebarContext.Provider value={{ isOpen, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}