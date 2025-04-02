import React, { useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface TextInputFieldProps {
  title: string; // This will be the key (e.g., 'name')
  description: string;
  type?: string | number;
  value: string | number;
  highlight?: boolean;
  focusPosition?: string | null;
  onChange: (key: string, newValue: string | null) => void;
}

const TextInputField = React.forwardRef<HTMLInputElement, TextInputFieldProps>(
  ({ title, description, value, onChange, highlight, focusPosition }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (highlight && focusPosition && containerRef.current) {
        // 移除現有的動畫
        containerRef.current.style.animation = 'none';
        // 強制重繪
        void containerRef.current.offsetHeight; // Use void operator to indicate intentional usage
        // 重新添加動畫
        containerRef.current.style.animation = '';
      }
    }, [highlight, focusPosition]);

    return (
      <div 
        ref={containerRef}
        className={`w-full max-w-sm bg-white px-4 pt-2 pb-4 border-b border-gray-200 ${
          highlight ? 'animate-highlight' : ''
        }`}
        data-position={focusPosition}
      >
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center space-x-2">
            <Check className="h-5 w-5 text-gray-500" />
            <span className="font-medium text-gray-800">{title}</span>
          </div>
          {value !== '' && (
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
            onChange(title, e.target.value);
          }}
        />
      </div>
    );
  }
);

TextInputField.displayName = 'TextInputField';

const MemoizedTextInputField = React.memo(TextInputField, (prev, next) => {
  // 只比較關鍵屬性
  return (
    prev.highlight === next.highlight &&
    prev.focusPosition === next.focusPosition &&
    prev.value === next.value
  );
});

MemoizedTextInputField.displayName = 'TextInputField';

export default MemoizedTextInputField;