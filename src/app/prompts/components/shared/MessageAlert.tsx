import React from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

interface MessageAlertProps {
  type: 'success' | 'error';
  message: string;
  onClose: () => void;
}

const MessageAlert: React.FC<MessageAlertProps> = ({ type, message, onClose }) => {
  const isSuccess = type === 'success';
  
  const baseClasses = "flex items-center justify-between gap-2 p-3 border rounded-md";
  const typeClasses = isSuccess 
    ? "bg-green-50 border-green-200"
    : "bg-rose-50 border-rose-200";
  
  const iconClasses = isSuccess 
    ? "h-4 w-4 text-green-600"
    : "h-4 w-4 text-rose-600";
    
  const textClasses = isSuccess 
    ? "text-sm text-green-700"
    : "text-sm text-rose-700";
    
  const buttonClasses = isSuccess
    ? "p-1 rounded-full hover:bg-green-100"
    : "p-1 rounded-full hover:bg-red-100";
    
  const buttonIconClasses = isSuccess
    ? "h-4 w-4 text-green-700"
    : "h-4 w-4 text-rose-700";

  return (
    <div className={`${baseClasses} ${typeClasses}`}>
      <div className="flex items-center gap-2">
        {isSuccess ? (
          <CheckCircle className={iconClasses} />
        ) : (
          <AlertCircle className={iconClasses} />
        )}
        <span className={textClasses}>{message}</span>
      </div>
      <button onClick={onClose} className={buttonClasses}>
        <X className={buttonIconClasses} />
      </button>
    </div>
  );
};

export default MessageAlert;