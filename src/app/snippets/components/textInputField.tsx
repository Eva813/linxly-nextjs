import React from 'react';
import { Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface TextInputFieldProps {
  title: string; // This will be the key (e.g., 'name')
  description: string;
  type?: string | number;
  value: string | number;
  // 變更 onChange 型別，null 表示要刪除該欄位
  onChange: (key: string, newValue: string | null) => void;
}

const TextInputField = React.forwardRef<HTMLInputElement, TextInputFieldProps>(
  ({ title, description, value, onChange }, ref) => {
    const shouldShowClearButton = value !== '';
    console.log('TextInputField value:', title);
    return (
      <div className="w-full max-w-sm bg-white px-4 pt-2 pb-4 border-b border-gray-200">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center space-x-2">
            <Check className="h-5 w-5 text-gray-500" />
            <span className="font-medium text-gray-800">{title}</span>
          </div>
          {shouldShowClearButton && (
            <button
              type="button"
              aria-label="Close"
              className="text-gray-500 hover:text-gray-700"
              onClick={() => onChange(title, null)}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500 pb-4">{description}</p>
        <Input
          ref={ref}
          id={`input-${title}`}
          value={value}
          className="h-9"
          onChange={(e) => {
            const newValue = e.target.value;
            console.log('Input value:', newValue);
            onChange(title, newValue);
          }}
        />
      </div>
    );
  }
);

TextInputField.displayName = 'TextInputField';
const MemoizedTextInputField = React.memo(TextInputField);
MemoizedTextInputField.displayName = 'TextInputField';

export default MemoizedTextInputField;