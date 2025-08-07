import React from 'react';
import { Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useForceRerender } from '@/lib/useForceRepaint';
import { useLocalInputWithDebounce } from '@/hooks/useLocalInputWithDebounce';


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
    const containerRef = useForceRerender(highlight, focusPosition);

    // 使用 debounced input hook 來減少父組件重新渲染
    const { localValue, handleLocalChange, setLocalValueDirectly } = useLocalInputWithDebounce({
      initialValue: String(value),
      onValueChange: (newValue) => {
        onChange(title, newValue);
      },
      delay: 800
    });

    // 處理清除按鈕 - 需要立即清空，不使用 debounce
    const handleClear = () => {
      setLocalValueDirectly(''); // 立即更新本地狀態
      onChange(title, null);
    };

    return (
      <div
        ref={containerRef}
        className={`w-full max-w-sm bg-white px-4 pt-2 pb-4 border-b border-gray-200 ${highlight ? 'animate-highlight' : ''
          }`}
        data-position={focusPosition}
      >
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center space-x-2">
            <Check className="h-5 w-5 text-gray-500" />
            <span className="font-medium text-gray-800">{title}</span>
          </div>
          {localValue !== '' && (
            <button
              type="button"
              aria-label="Close"
              className="text-gray-500 hover:text-gray-700"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500 pb-4">{description}</p>
        <Input
          ref={ref}
          id={`input-${title}`}
          value={localValue}
          className="h-9"
          onChange={handleLocalChange}
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