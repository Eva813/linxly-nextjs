import { useState, useCallback } from 'react';
import { createInviteLink } from '@/api/spaceShares';

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
}

interface UseInviteLinksReturn {
  inviteLinks: InviteLinks;
  generatingLink: 'view' | 'edit' | null;
  generateInviteLink: (permission: 'view' | 'edit') => Promise<{ success: boolean; error?: string; link?: string }>;
  copyInviteLink: (permission: 'view' | 'edit') => { success: boolean; error?: string };
  resetInviteLinks: () => void;
}

export const useInviteLinks = ({ spaceId }: UseInviteLinksProps): UseInviteLinksReturn => {
  const [inviteLinks, setInviteLinks] = useState<InviteLinks>({});
  const [generatingLink, setGeneratingLink] = useState<'view' | 'edit' | null>(null);

  const generateInviteLink = useCallback(async (permission: 'view' | 'edit') => {
    try {
      setGeneratingLink(permission);
      
      const response = await createInviteLink(spaceId, permission);
      const inviteLink = `${window.location.origin}/invite/${response.shareId}`;
      
      setInviteLinks(prev => ({
        ...prev,
        [permission]: {
          link: inviteLink,
          shareId: response.shareId,
          expiresAt: response.expiresAt
        }
      }));
      
      await navigator.clipboard.writeText(inviteLink);
      
      return { 
        success: true, 
        link: inviteLink 
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
  }, [spaceId]);

  const copyInviteLink = useCallback((permission: 'view' | 'edit') => {
    const linkData = inviteLinks[permission];
    if (linkData) {
      navigator.clipboard.writeText(linkData.link);
      return { success: true };
    }
    return { success: false, error: 'No invite link found' };
  }, [inviteLinks]);

  const resetInviteLinks = useCallback(() => {
    setInviteLinks({});
  }, []);

  return {
    inviteLinks,
    generatingLink,
    generateInviteLink,
    copyInviteLink,
    resetInviteLinks
  };
};