import { useCallback } from 'react';

export const useLocalFlowData = (boardId: string) => {
  const getFlowData = useCallback(() => {
    try {
      return JSON.parse(localStorage.getItem(`flowData-${boardId}`) ?? '{}');
    } catch (error) {
      console.error(`Failed to parse flowData for board ${boardId}:`, error);
      return {};
    }
  }, [boardId]);

  const saveFlowData = useCallback((data: object) => {
    localStorage.setItem(`flowData-${boardId}`, JSON.stringify(data));
  }, [boardId]);

  return { getFlowData, saveFlowData };
};
