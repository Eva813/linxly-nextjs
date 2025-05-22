import { StateCreator } from 'zustand';
import { MatchedPrompt } from '@/types/prompt';

export interface UISlice {
  isDialogOpen: boolean;
  matchedPrompt: MatchedPrompt;
  setIsDialogOpen: (open: boolean) => void;
  setMatchedPrompt: (prompt: MatchedPrompt) => void;
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  isDialogOpen: false,
  matchedPrompt: {
    content: '',
    targetElement: null,
    insert: false,
    shortcut: '',
  },
  setIsDialogOpen: (open: boolean) => set({ isDialogOpen: open }),
  setMatchedPrompt: (prompt: MatchedPrompt) => set({ matchedPrompt: prompt }),
});