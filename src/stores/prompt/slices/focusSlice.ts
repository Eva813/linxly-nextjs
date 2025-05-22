import { StateCreator } from 'zustand';

export interface FocusSlice {
  focusKey: string | null;
  setFocusKey: (key: string | null) => void;
}

export const createFocusSlice: StateCreator<FocusSlice> = (set) => ({
  focusKey: null,
  setFocusKey: (key) => set({ focusKey: key }),
});