import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FaSpinner } from "react-icons/fa";
import { Copy, Clock } from "lucide-react";

interface InviteLink {
  link: string;
  shareId: string;
  expiresAt: string;
}

interface InviteLinksState {
  view?: InviteLink;
  edit?: InviteLink;
}

interface InviteLinksProps {
  inviteLinks: InviteLinksState;
  generatingLink: 'view' | 'edit' | null;
  loading?: boolean;
  onGenerateLink: (permission: 'view' | 'edit') => void;
  onCopyLink: (permission: 'view' | 'edit') => void;
}

const InviteLinksSection: React.FC<InviteLinksProps> = ({
  inviteLinks,
  generatingLink,
  loading = false,
  onGenerateLink,
  onCopyLink
}) => {
  // Helper function to check if link is expired
  const isLinkExpired = (expiresAt: string) => {
    return new Date() > new Date(expiresAt);
  };

  // Helper function to get expiry status and message
  const getExpiryInfo = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);

    // Early return for expired links
    if (expiry.getTime() <= now.getTime()) {
      return {
        status: 'expired',
        message: 'Expired',
        className: 'text-rose-600'
      };
    }

    // 計算純日期的天數差（不考慮時間）
    const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const expiryDateOnly = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
    const diffMs = expiryDateOnly.getTime() - nowDateOnly.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    const EXPIRING_THRESHOLD = 3;

    // Message mapping for cleaner logic
    const getMessage = (days: number): string => {
      const messages: Record<number, string> = {
        0: 'Expires today',
        1: 'Expires tomorrow'
      };
      return messages[days] || `Expires in ${days} days`;
    };

    const message = getMessage(diffDays);
    const isExpiring = diffDays <= EXPIRING_THRESHOLD;

    return {
      status: isExpiring ? 'expiring' : 'valid',
      message,
      className: isExpiring ? 'text-amber-600' : 'text-gray-500'
    };
  };

  // Helper function to render link with expiry info
  const renderLinkWithExpiry = (permission: 'view' | 'edit', linkData: InviteLink) => {
    const expiryInfo = getExpiryInfo(linkData.expiresAt);
    
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-1">
          <Input
            value={linkData.link}
            readOnly
            className="flex-1 h-8 text-xs bg-green-50 border-green-200"
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 flex-shrink-0 hover:bg-green-100"
            onClick={() => onCopyLink(permission)}
            title="Copy link"
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
        <div className={`flex items-center justify-between text-xs`}>
          <div className={`flex items-center gap-1 ${expiryInfo.className}`}>
            <Clock className="h-3 w-3" />
            <span>{expiryInfo.message}</span>
          </div>
        </div>
      </div>
    );
  };
  return (
    <div className="border rounded-md p-3 bg-blue-50 border-blue-200">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-blue-900">Universal Invite Links</h4>
        {loading && (
          <FaSpinner className="animate-spin h-3 w-3 text-blue-600" />
        )}
      </div>
      <p className="text-xs text-blue-700 mb-2">
        Generate links for invited users—only listed emails can use them to join.
      </p>
      
      <div className="space-y-3">
        <div className="flex gap-2">
          {/* View Permission Link */}
          <div className="flex-1">
            {inviteLinks.view && !isLinkExpired(inviteLinks.view.expiresAt) ? (
              renderLinkWithExpiry('view', inviteLinks.view)
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onGenerateLink('view')}
                disabled={generatingLink === 'view' || loading}
                className="w-full h-8 text-xs"
              >
                {generatingLink === 'view' ? (
                  <>
                    <FaSpinner className="animate-spin mr-1" />
                    Generating...
                  </>
                ) : loading ? (
                  <>
                    <FaSpinner className="animate-spin mr-1" />
                    Loading...
                  </>
                ) : (
                  'Generate View Link'
                )}
              </Button>
            )}
          </div>

          {/* Edit Permission Link */}
          <div className="flex-1">
            {inviteLinks.edit && !isLinkExpired(inviteLinks.edit.expiresAt) ? (
              renderLinkWithExpiry('edit', inviteLinks.edit)
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onGenerateLink('edit')}
                // {generatingLink === 'edit' || loading}
                disabled={true}
                className="w-full h-8 text-xs"
              >
                {generatingLink === 'edit' ? (
                  <>
                    <FaSpinner className="animate-spin mr-1" />
                    Generating...
                  </>
                ) : loading ? (
                  <>
                    <FaSpinner className="animate-spin mr-1" />
                    Loading...
                  </>
                ) : (
                  'Generate Edit Link'
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteLinksSection;