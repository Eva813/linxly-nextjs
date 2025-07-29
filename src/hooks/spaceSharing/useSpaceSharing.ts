import { useState, useEffect, useCallback } from 'react';
import { 
  getSpaceShares, 
  batchCreateShares, 
  batchUpdateShares,
  batchDeleteShares,
  isValidEmail 
} from '@/api/spaceShares';
import { ShareRecord, ShareItem } from '@/shared/types/spaceSharing';

interface UseSpaceSharingProps {
  spaceId: string;
  isOpen: boolean;
}

interface UseSpaceSharingReturn {
  shareRecords: ShareRecord[];
  originalShareRecords: ShareRecord[];
  loading: boolean;
  savingShares: boolean;
  progress: { completed: number; total: number };
  addEmailToShares: (email: string, permission: 'view' | 'edit') => { success: boolean; error?: string };
  removeEmailFromShares: (email: string) => Promise<{ success: boolean; error?: string }>;
  batchRemoveEmails: (emails: string[]) => Promise<{ success: boolean; error?: string }>;
  updateEmailPermission: (email: string, permission: 'view' | 'edit') => void;
  saveAllShares: () => Promise<{ success: boolean; error?: string }>;
  refreshShares: () => Promise<void>;
}

export const useSpaceSharing = ({ spaceId, isOpen }: UseSpaceSharingProps): UseSpaceSharingReturn => {
  const [shareRecords, setShareRecords] = useState<ShareRecord[]>([]);
  const [originalShareRecords, setOriginalShareRecords] = useState<ShareRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingShares, setSavingShares] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });

  const loadShareRecords = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getSpaceShares(spaceId);
      setShareRecords(response.shares);
      setOriginalShareRecords(response.shares);
    } catch (error) {
      console.error('Failed to load share records:', error);
      throw new Error('Failed to load sharing settings');
    } finally {
      setLoading(false);
    }
  }, [spaceId]);

  useEffect(() => {
    if (isOpen) {
      loadShareRecords();
    }
  }, [isOpen, loadShareRecords]);

  const addEmailToShares = useCallback((email: string, permission: 'view' | 'edit') => {
    const trimmedEmail = email.trim();
    
    if (!trimmedEmail) {
      return { success: false, error: 'Email address is required' };
    }
    
    if (!isValidEmail(trimmedEmail)) {
      return { success: false, error: 'Please enter a valid email address' };
    }

    if (shareRecords.some(record => record.email === trimmedEmail)) {
      return { success: false, error: 'This email is already shared' };
    }

    const newRecord: ShareRecord = {
      id: Date.now().toString(),
      email: trimmedEmail,
      permission,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setShareRecords(prev => [...prev, newRecord]);
    return { success: true };
  }, [shareRecords]);

  const removeEmailFromShares = useCallback(async (email: string) => {
    try {
      const existingRecord = originalShareRecords.find(record => record.email === email);
      
      if (existingRecord) {
        setLoading(true);
        const deleteResults = await batchDeleteShares(spaceId, [email]);
        
        if (deleteResults.failed.length > 0) {
          return { 
            success: false, 
            error: `Failed to delete ${email}: ${deleteResults.failed[0].reason}` 
          };
        }
        
        setOriginalShareRecords(prev => prev.filter(record => record.email !== email));
      }
      
      setShareRecords(prev => prev.filter(record => record.email !== email));
      return { success: true };
      
    } catch (error) {
      console.error('Failed to remove email:', error);
      return { success: false, error: `Failed to remove ${email}` };
    } finally {
      setLoading(false);
    }
  }, [spaceId, originalShareRecords]);

  const batchRemoveEmails = useCallback(async (emails: string[]) => {
    try {
      const emailsToDeleteFromBackend = emails.filter(email => 
        originalShareRecords.some(record => record.email === email)
      );
      
      if (emailsToDeleteFromBackend.length > 0) {
        setLoading(true);
        const deleteResults = await batchDeleteShares(spaceId, emailsToDeleteFromBackend);
        
        if (deleteResults.failed.length > 0) {
          console.error('Failed batch delete:', deleteResults.failed);
          return { success: false, error: 'Failed to delete some emails. Check console for details.' };
        }
        
        setOriginalShareRecords(prev => prev.filter(record => 
          !emailsToDeleteFromBackend.includes(record.email)
        ));
      }
      
      setShareRecords(prev => prev.filter(record => !emails.includes(record.email)));
      return { success: true };
      
    } catch (error) {
      console.error('Failed to batch delete:', error);
      return { success: false, error: 'Failed to delete selected emails' };
    } finally {
      setLoading(false);
    }
  }, [spaceId, originalShareRecords]);

  const updateEmailPermission = useCallback((email: string, permission: 'view' | 'edit') => {
    setShareRecords(prev => prev.map(record => 
      record.email === email ? { ...record, permission } : record
    ));
  }, []);

  const saveAllShares = useCallback(async () => {
    try {
      setSavingShares(true);
      setProgress({ completed: 0, total: shareRecords.length });

      const sharesToCreate: ShareItem[] = shareRecords
        .filter(record => !record.userId)
        .map(record => ({ email: record.email, permission: record.permission }));

      const sharesToUpdate: ShareItem[] = shareRecords
        .filter(record => record.userId)
        .map(record => ({ email: record.email, permission: record.permission }));

      const results: {
        success: Array<{email: string; shareId: string; inviteLink: string}>;
        failed: Array<{email: string; reason: string}>;
      } = { success: [], failed: [] };

      if (sharesToCreate.length > 0) {
        const createResults = await batchCreateShares(
          spaceId, 
          sharesToCreate,
          (completed, total) => setProgress({ completed, total })
        );
        results.success.push(...(createResults.success || []));
        results.failed.push(...(createResults.failed || []));
      }

      if (sharesToUpdate.length > 0) {
        const updateResults = await batchUpdateShares(
          spaceId,
          sharesToUpdate,
          (completed, total) => setProgress({ completed, total })
        );
        results.failed.push(...(updateResults.failed || []));
      }

      if (results.failed.length === 0) {
        await loadShareRecords();
        return { success: true };
      } else {
        console.error('Failed shares:', results.failed);
        return { 
          success: false, 
          error: `${results.failed.length} emails failed. Check console for details.` 
        };
      }

    } catch (error) {
      console.error('Failed to save sharing settings:', error);
      return { success: false, error: 'Failed to save sharing settings' };
    } finally {
      setSavingShares(false);
      setProgress({ completed: 0, total: 0 });
    }
  }, [spaceId, shareRecords, loadShareRecords]);

  const refreshShares = useCallback(async () => {
    await loadShareRecords();
  }, [loadShareRecords]);

  return {
    shareRecords,
    originalShareRecords,
    loading,
    savingShares,
    progress,
    addEmailToShares,
    removeEmailFromShares,
    batchRemoveEmails,
    updateEmailPermission,
    saveAllShares,
    refreshShares
  };
};