import React, { createContext } from 'react';

export type PreviewContextType = {
  values: Record<string, string | string[]>;
  setValues: React.Dispatch<React.SetStateAction<Record<string, string | string[]>>>;
};

export const PreviewContext = createContext<PreviewContextType>({
  values: {},
  setValues: () => {},
});
