import { Input } from "@/components/ui/input";
import { ReactNode } from "react";

interface InputFieldProps {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  suffix?: ReactNode;
}

export function InputField({ id, label, type, placeholder, value, onChange, suffix }: InputFieldProps) {
  return (
    <div className="relative">
      <label htmlFor={id} className="block text-sm text-gray-700 mb-1 dark:text-gray-300">
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          type={type}
          placeholder={placeholder}
          className="w-full h-10 px-3 pr-10 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          value={value}
          onChange={onChange}
        />
        {suffix && (
          <div className="absolute inset-y-0 right-2 flex items-center">
            {suffix}
          </div>
        )}
      </div>
    </div>
  );
}