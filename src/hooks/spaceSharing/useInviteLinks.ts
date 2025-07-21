import { useState, useCallback, useEffect } from 'react';
import { createInviteLink, getInviteLinks } from '@/api/spaceShares';

interface InviteLink {
  link: string;
  shareId: string;
  expiresAt: string;
}

interface InviteLinks {
  view?: InviteLink;
  edit?: InviteLink;
}

interface UseInviteLinksProps {
  spaceId: string;
  isOpen?: boolean;
}

interface UseInviteLinksReturn {
  inviteLinks: InviteLinks;
  generatingLink: 'view' | 'edit' | null;
  loading: boolean;
  generateInviteLink: (permission: 'view' | 'edit') => Promise<{ success: boolean; error?: string; link?: string }>;
  copyInviteLink: (permission: 'view' | 'edit') => { success: boolean; error?: string };
  refreshInviteLinks: () => Promise<void>;
}

// Helper function to check if link is expired (Taiwan timezone) - outside component to use in useState
const checkLinkExpiry = (expiresAt: string) => {
  const nowTaipei = new Date().toLocaleString("en-US", { timeZone: "Asia/Taipei" });
  const expiryTaipei = new Date(expiresAt).toLocaleString("en-US", { timeZone: "Asia/Taipei" });
  return new Date(nowTaipei) > new Date(expiryTaipei);
};

export const useInviteLinks = ({ spaceId, isOpen = false }: UseInviteLinksProps): UseInviteLinksReturn => {
  // Helper function to get localStorage key
  const getStorageKey = (id: string) => `invite-links-${id}`;


  // State
  const [inviteLinks, setInviteLinks] = useState<InviteLinks>({});
  const [generatingLink, setGeneratingLink] = useState<'view' | 'edit' | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if we have valid cached data
  const hasValidCache = useCallback(() => {
    if (typeof window === 'undefined' || !spaceId) return false;
    
    try {
      const stored = localStorage.getItem(getStorageKey(spaceId));
      if (!stored) return false;
      
      const parsed = JSON.parse(stored);
      // Check if we have at least one valid (non-expired) link
      const hasValidView = parsed.view && !checkLinkExpiry(parsed.view.expiresAt);
      const hasValidEdit = parsed.edit && !checkLinkExpiry(parsed.edit.expiresAt);
      
      return hasValidView || hasValidEdit;
    } catch {
      return false;
    }
  }, [spaceId]);

  // Load valid links from cache
  const loadFromCache = useCallback(() => {
    if (typeof window === 'undefined') return {};
    
    try {
      const stored = localStorage.getItem(getStorageKey(spaceId));
      if (stored) {
        const parsed = JSON.parse(stored);
        const validLinks: InviteLinks = {};
        
        if (parsed.view && !checkLinkExpiry(parsed.view.expiresAt)) {
          validLinks.view = parsed.view;
        }
        if (parsed.edit && !checkLinkExpiry(parsed.edit.expiresAt)) {
          validLinks.edit = parsed.edit;
        }
        
        return validLinks;
      }
    } catch (error) {
      console.warn('Failed to load invite links from localStorage:', error);
    }
    
    return {};
  }, [spaceId]);

  // Fetch invite links from API
  const fetchInviteLinks = useCallback(async () => {
    if (!spaceId) {
      console.warn('Cannot fetch invite links: spaceId is empty');
      return;
    }
    
    try {
      setLoading(true);
      const response = await getInviteLinks(spaceId);
      
      if (response.success) {
        setInviteLinks(response.inviteLinks);
        
        // Update localStorage cache
        if (typeof window !== 'undefined') {
          try {
            if (Object.keys(response.inviteLinks).length > 0) {
              localStorage.setItem(getStorageKey(spaceId), JSON.stringify(response.inviteLinks));
            } else {
              localStorage.removeItem(getStorageKey(spaceId));
            }
          } catch (error) {
            console.warn('Failed to save invite links to localStorage:', error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch invite links:', error);
      // Fall back to cache if API fails
      const cachedLinks = loadFromCache();
      setInviteLinks(cachedLinks);
    } finally {
      setLoading(false);
    }
  }, [spaceId, loadFromCache]);

  // Simple loading strategy: load cache first, fetch if needed
  useEffect(() => {
    if (!spaceId || !isOpen) {
      return;
    }
    
    // Always fetch from API to ensure latest data, but use cache as fallback
    fetchInviteLinks();
  }, [spaceId, isOpen, hasValidCache, loadFromCache, fetchInviteLinks]);

  // Generate invite link (create via API, then refresh from API)
  const generateInviteLink = useCallback(async (permission: 'view' | 'edit') => {
    try {
      setGeneratingLink(permission);
      
      const response = await createInviteLink(spaceId, permission);
      
      // Refresh from API to get latest state
      await fetchInviteLinks();
      
      await navigator.clipboard.writeText(`${window.location.origin}/invite/${response.shareId}`);
      
      return { 
        success: true, 
        link: `${window.location.origin}/invite/${response.shareId}`
      };
      
    } catch (error) {
      console.error('Failed to generate invite link:', error);
      return { 
        success: false, 
        error: 'Failed to generate invite link' 
      };
    } finally {
      setGeneratingLink(null);
    }
  }, [spaceId, fetchInviteLinks]);

  const copyInviteLink = useCallback((permission: 'view' | 'edit') => {
    const linkData = inviteLinks[permission];
    if (linkData) {
      navigator.clipboard.writeText(linkData.link);
      return { success: true };
    }
    return { success: false, error: 'No invite link found' };
  }, [inviteLinks]);

  const refreshInviteLinks = useCallback(async () => {
    await fetchInviteLinks();
  }, [fetchInviteLinks]);

  return {
    inviteLinks,
    generatingLink,
    loading,
    generateInviteLink,
    copyInviteLink,
    refreshInviteLinks
  };
};