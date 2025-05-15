import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface ShareFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  folderId: string;
}

const ShareFolderDialog: React.FC<ShareFolderDialogProps> = ({
  isOpen,
  onClose,
  folderId,
}) => {
  const { data: session } = useSession();
  const [emails, setEmails] = useState("");
  const [permission, setPermission] = useState("Viewer");
  const [shares, setShares] = useState<{ email: string; permission: string }[]>([]);

  // 初始化目前使用者為第一筆 Owner
  useEffect(() => {
    if (session?.user?.email && shares.length === 0) {
      setShares([{ email: session.user.email, permission: "Owner" }]);
    }
  }, [session?.user?.email, shares.length]);
  
  const handleShare = () => {
    console.log("Sharing folder", folderId);
    const list = emails
      .split(",")
      .map((e) => e.trim())
      .filter((e) => e);
    const newItems = list.map((e) => ({ email: e, permission }));
    setShares((prev) => [...prev, ...newItems]);
    setEmails("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Share My Sample Snippets</DialogTitle>
        </DialogHeader>
        <div>
            <span>Enter email to share (comma separated)</span>
          <div className="w-full flex items-center space-x-2 mb-4">
            <div className="flex-1 flex border rounded overflow-hidden">
              <input
                type="text"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                placeholder="jane@example.com, john@example.com"
                className="flex-1 px-2 py-1 border-none focus:ring-0 focus:outline-none"
              />
                <Select value={permission} onValueChange={setPermission}>
                <SelectTrigger className="h-full px-2  border-l border-none bg-transparent focus:ring-0 focus:outline-none w-1/4">
                  <SelectValue placeholder="Viewer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Viewer">Viewer</SelectItem>
                  <SelectItem value="Editor">Editor</SelectItem>
                  {/* <SelectItem value="Owner">Owner</SelectItem> */}
                </SelectContent>
                </Select>
            </div>
            <Button 
              className="flex" 
              onClick={handleShare} 
              disabled={!emails.trim()}
            >
              Share
            </Button>
          </div>
          {/* 已分享清單 */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="px-2 py-1">User</th>
                  <th className="px-2 py-1">Permission for folder</th>
                </tr>
              </thead>
              <tbody>
                {shares.map((s, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="px-2 py-2">{s.email}</td>
                    <td className="px-2 py-2">{s.permission}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <DialogFooter className="mt-2 flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareFolderDialog;