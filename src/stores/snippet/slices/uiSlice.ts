import { StateCreator } from 'zustand';
import { MatchedSnippet } from '@/types/snippets';

export interface UISlice {
  isDialogOpen: boolean;
  matchedSnippet: MatchedSnippet;
  setIsDialogOpen: (open: boolean) => void;
  setMatchedSnippet: (snippet: MatchedSnippet) => void;
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  isDialogOpen: false,
  matchedSnippet: {
    content: '',
    targetElement: null,
    insert: false,
    shortcut: '',
  },
  setIsDialogOpen: (open: boolean) => set({ isDialogOpen: open }),
  setMatchedSnippet: (snippet: MatchedSnippet) => set({ matchedSnippet: snippet }),
});