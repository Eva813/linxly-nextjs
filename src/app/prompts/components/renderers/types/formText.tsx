import React from "react";

interface FormTextOptions {
  attrs: Record<string, string>;
  key: string;
  isControlled?: boolean;
  values?: Record<string, string | string[]>;
  setValues?: (updater: (prev: Record<string, string | string[]>) => Record<string, string | string[]>) => void;
}

export function renderFormText({ 
  attrs, 
  key, 
  isControlled = false, 
  values, 
  setValues 
}: FormTextOptions) {
  const name = attrs.name;
  const defaultValue = attrs.default || "";

  const inputProps = {
    key,
    placeholder: name || "Label",
    className: "border border-gray-400 bg-light px-2 py-1 rounded",
  };

  if (isControlled && values && setValues) {
    return (
      <input
        {...inputProps}
        value={values[name] as string ?? defaultValue}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
          setValues(prev => ({ ...prev, [name]: e.target.value }))
        }
      />
    );
  }

  // 非受控模式
  return (
    <input
      {...inputProps}
      defaultValue={defaultValue}
    />
  );
}

// 保持向後相容性的輔助函式
export function createControlledFormText(
  attrs: Record<string, string>, 
  key: string,
  values: Record<string, string | string[]>,
  setValues: (updater: (prev: Record<string, string | string[]>) => Record<string, string | string[]>) => void
) {
  return renderFormText({ attrs, key, isControlled: true, values, setValues });
}