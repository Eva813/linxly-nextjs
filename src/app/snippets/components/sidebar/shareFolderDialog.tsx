import React, { useState } from "react";
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
import { shareFolder, deleteShareFolder } from "@/api/folders";
import { Cross2Icon } from "@radix-ui/react-icons"

interface ShareFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  folderId: string;
  shares: { email: string; permission: string, _id: string }[];
  setShares: React.Dispatch<React.SetStateAction<{ email: string; permission: string }[]>>;
}

const ShareFolderDialog: React.FC<ShareFolderDialogProps> = ({
  isOpen,
  onClose,
  folderId,
  shares,
  setShares,
}) => {
  const [emails, setEmails] = useState("");
  const [permission, setPermission] = useState("Viewer");
  // 目前點擊 Share 按鈕後會直接呼叫 shareFolder API，就會阻擋預設的表單提交

  const handleShare = async () => {
    if (!emails.trim()) return;
    const list = emails
      .split(",")
      .map((e) => e.trim())
      .filter((e) => e);
    try {
      await shareFolder(folderId, list, permission);
      const newItems = list.map((e) => ({ email: e, permission }));
      setShares((prev) => [...prev, ...newItems]);
      setEmails("");
    } catch (error: unknown) {
      console.error(error);
    }
  };
  const handleRemoveShare = async (shareId: string, idx: number) => {
    if (!shareId) return;
    try {
      console.log("handleRemoveShare", shareId, idx);
      await deleteShareFolder(folderId, shareId);
      setShares((prev) => prev.filter((_, i) => i !== idx));
    } catch (error: unknown) {
      console.error(error);
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" aria-describedby="share-folder-description">
        <DialogHeader>
          <DialogTitle>Share My Sample Snippets</DialogTitle>
        </DialogHeader>
        <div id="share-folder-description">
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
                    <td className="px-2 py-2">
                      {idx !== 0 && (
                      <Cross2Icon
                        className="h-4 w-4 cursor-pointer"
                        onClick={() => handleRemoveShare(s._id, idx)}
                      />
                      )}
                    </td>
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