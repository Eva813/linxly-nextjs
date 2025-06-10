import React from "react";
import FormMenuMultiSelect from "@/app/prompts/components/renderers/FormMenuMultiSelect";

interface FormMenuOptions {
  attrs: Record<string, string>;
  key: string;
  isControlled?: boolean;
  values?: Record<string, string | string[]>;
  setValues?: (updater: (prev: Record<string, string | string[]>) => Record<string, string | string[]>) => void;
}

export function renderFormMenu({ 
  attrs, 
  key, 
  isControlled = false, 
  values, 
  setValues 
}: FormMenuOptions) {
  const name = attrs.name;
  const defaultValue = Array.isArray(attrs.default)
    ? attrs.default
    : typeof attrs.default === "string"
    ? attrs.default.split(",").map((v) => v.trim())
    : [];

  // 處理 options
  const options = Array.isArray(attrs.options)
    ? attrs.options
    : typeof attrs.options === "string"
    ? attrs.options.split(",").map((v) => v.trim())
    : [];

  const isMultiple =
    typeof attrs.multiple === "string"
      ? ["true", "yes", "1"].includes(attrs.multiple.toLowerCase())
      : Boolean(attrs.multiple);

  // 多選情況
  if (isMultiple) {
    const multiSelectProps = {
      key,
      customKey: key,
      name,
      defaultValue,
      options,
    };

    // 如果是受控模式，加上 value 和 onChange
    if (isControlled && values && setValues) {
      return (
        <FormMenuMultiSelect
          {...multiSelectProps}
          value={values[name] as string[] ?? defaultValue}
          onChange={(newVals: string[]) => setValues(prev => ({ ...prev, [name]: newVals }))}
        />
      );
    }

    return <FormMenuMultiSelect {...multiSelectProps} />;
  }

  // 單選情況
  const selectProps = {
    key,
    id: name ? `field_renderer_${name}` : undefined,
    className: "border border-gray-400 bg-light px-2 py-1 rounded",
  };

  // 如果是受控模式
  if (isControlled && values && setValues) {
    return (
      <select
        {...selectProps}
        value={values[name] as string ?? defaultValue[0] ?? ""}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
          setValues(prev => ({ ...prev, [name]: e.target.value }))
        }
      >
        {options.map((opt, i) => (
          <option key={`${opt}-${i}`} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  // 非受控模式
  return (
    <select
      {...selectProps}
      defaultValue={defaultValue[0] || ""}
    >
      {options.map((opt, i) => (
        <option key={`${opt}-${i}`} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

// 保持向後相容性的輔助函式
export function createControlledFormMenu(
  attrs: Record<string, string>, 
  key: string,
  values: Record<string, string | string[]>,
  setValues: (updater: (prev: Record<string, string | string[]>) => Record<string, string | string[]>) => void
) {
  return renderFormMenu({ attrs, key, isControlled: true, values, setValues });
}