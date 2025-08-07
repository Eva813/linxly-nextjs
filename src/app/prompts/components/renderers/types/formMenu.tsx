import React, { useState } from "react";
import FormMenuMultiSelect from "@/app/prompts/components/renderers/FormMenuMultiSelect";

type AttrValue = string | string[] | boolean | number;

export function renderFormMenu(attrs: Record<string, AttrValue>, key: string) {
  const name = String(attrs.name || "");
  
  // 處理 options
  const options = Array.isArray(attrs.options)
    ? attrs.options.map(String)
    : typeof attrs.options === "string"
    ? attrs.options.split(",").map((v) => v.trim())
    : [];

  // 檢查是否為多選
  const isMultiple =
    typeof attrs.multiple === "string"
      ? ["true", "yes", "1"].includes(attrs.multiple.toLowerCase())
      : Boolean(attrs.multiple);

  // 根據是否多選來處理 defaultValue
  const defaultValue = Array.isArray(attrs.default)
    ? attrs.default.map(String)
    : typeof attrs.default === "string"
    ? attrs.default.split(",").map((v) => v.trim())
    : attrs.default
    ? [String(attrs.default)]
    : [];

  if (isMultiple) {
    // 創建一個包含狀態管理的組件
    const MultiSelectWithState = () => {
      const [selectedValue, setSelectedValue] = useState<string[]>(defaultValue);
      
      return (
        <FormMenuMultiSelect
          customKey={key}
          name={name}
          value={selectedValue}
          onChange={setSelectedValue}
          options={options}
        />
      );
    };

    return <MultiSelectWithState key={key} />;
  }

  // 對於單選，我們需要一個字符串值而不是陣列
  const singleDefaultValue = defaultValue.length > 0 ? defaultValue[0] : "";

  return (
    <select
      key={key}
      id={name ? `field_renderer_${name}` : undefined}
      defaultValue={singleDefaultValue}
      className="border border-gray-400 bg-light px-2 py-1 rounded"
    >
      {options.map((opt, i) => (
        <option key={`${opt}-${i}`} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}
