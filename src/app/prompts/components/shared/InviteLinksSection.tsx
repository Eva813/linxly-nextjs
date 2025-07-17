import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FaSpinner } from "react-icons/fa";
import { Copy } from "lucide-react";

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
  onGenerateLink: (permission: 'view' | 'edit') => void;
  onCopyLink: (permission: 'view' | 'edit') => void;
}

const InviteLinksSection: React.FC<InviteLinksProps> = ({
  inviteLinks,
  generatingLink,
  onGenerateLink,
  onCopyLink
}) => {
  return (
    <div className="border rounded-md p-3 bg-blue-50 border-blue-200">
      <h4 className="text-sm font-medium text-blue-900 mb-2">Universal Invite Links</h4>
      <p className="text-xs text-blue-700 mb-2">
        Generate links for invited users—only listed emails can use them to join.
      </p>
      
      <div className="space-y-3">
        <div className="flex gap-2">
          {/* View Permission Link */}
          <div className="flex-1">
            {inviteLinks.view ? (
              <div className="flex items-center gap-1">
                <Input
                  value={inviteLinks.view.link}
                  readOnly
                  className="flex-1 h-8 text-xs bg-green-50 border-green-200"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-green-100 flex-shrink-0"
                  onClick={() => onCopyLink('view')}
                  title="Copy link"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onGenerateLink('view')}
                disabled={generatingLink === 'view'}
                className="w-full h-8 text-xs"
              >
                {generatingLink === 'view' ? (
                  <>
                    <FaSpinner className="animate-spin mr-1" />
                    Generating...
                  </>
                ) : (
                  'Generate View Link'
                )}
              </Button>
            )}
          </div>

          {/* Edit Permission Link */}
          <div className="flex-1">
            {inviteLinks.edit ? (
              <div className="flex items-center gap-1">
                <Input
                  value={inviteLinks.edit.link}
                  readOnly
                  className="flex-1 h-8 text-xs bg-green-50 border-green-200"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-green-100 flex-shrink-0"
                  onClick={() => onCopyLink('edit')}
                  title="Copy link"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onGenerateLink('edit')}
                disabled={generatingLink === 'edit'}
                className="w-full h-8 text-xs"
              >
                {generatingLink === 'edit' ? (
                  <>
                    <FaSpinner className="animate-spin mr-1" />
                    Generating...
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