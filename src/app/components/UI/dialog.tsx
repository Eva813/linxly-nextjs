import React from 'react';
import { Dialog, DialogContent, DialogClose, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface CustomDialogProps {
  message: string;
  isOpen: boolean;
  onClose: () => void;
}

const TextContentDialog = ({ message, isOpen, onClose }: CustomDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="bg-white p-6 rounded-lg shadow-lg max-w-lg mx-auto mt-10"
      >
        <DialogTitle className='text-xl'>
          輸出結果
        </DialogTitle>

        {/* Wrap message in DialogDescription */}
        <DialogDescription asChild>
          {/* Replace with div or span to prevent nesting issues */}
          <div className="mb-4 mt-2 p-2 border rounded border-gray-700 pt-2 text-gray-500">
            {message}
          </div>
        </DialogDescription>

        {/* Footer Button */}
        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
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
