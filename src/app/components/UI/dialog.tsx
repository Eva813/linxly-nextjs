import React from 'react';
import { Dialog, DialogContent, DialogClose, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface CustomDialogProps {
  message: string;
  isOpen: boolean;
  onClose: () => void;
}

const TextContentDialog = ({ message, isOpen, onClose }: CustomDialogProps) => {

  // Function to handle file download
  const handleDownload = () => {
    const blob = new Blob([message], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'output.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white p-6 rounded-lg shadow-lg max-w-lg mx-auto mt-10">
        <DialogTitle className="text-xl">
          輸出結果
        </DialogTitle>

        <DialogDescription asChild>
          <div className="mb-4 mt-2 p-2 border rounded border-gray-700 pt-2 text-gray-500">
            {message}
          </div>
        </DialogDescription>

        <DialogFooter className="flex space-x-4 sm:justify-between">
          {/* Download Button on the left */}
          <button
            onClick={handleDownload}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            下載 TXT
          </button>
          <DialogClose asChild>
            {/* Close Button on the right */}
            <button
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              關閉
            </button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TextContentDialog;
