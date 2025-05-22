import React from 'react';
import { FiAlertCircle } from "react-icons/fi";
import { RiCloseCircleLine } from "react-icons/ri";

interface ShortcutError {
  conflictingShortcut: string;
  message: string;
}

interface ShortcutErrorAlertProps {
  error: ShortcutError;
  onClose: () => void;
}

const ShortcutErrorAlert: React.FC<ShortcutErrorAlertProps> = ({ error, onClose }) => {
  return (
    <div
      className="fixed mt-3 z-20 bg-red-50 border border-red-200 rounded p-2 shadow-lg w-[calc(100%-10px)] max-w-[380px]"
    >
      <div className="relative">
      <button
        className="absolute right-1 text-red-400 hover:text-red-600 mt-[2px]"
        onClick={onClose}
        aria-label="close"
      >
        <RiCloseCircleLine className="h-4 w-4" />
      </button>

      <div className="flex items-start space-x-2 items-center pr-2">
          <FiAlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm">
          <span className="text-red-500">Conflicting shortcut with </span>
          <span className="font-semibold text-red-600">{error.conflictingShortcut}</span>
          <span className="text-red-500">. {error.message}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShortcutErrorAlert;