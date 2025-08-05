import React, { useState } from "react";
import FormMenuMultiSelect from "@/app/prompts/components/renderers/FormMenuMultiSelect";

export function renderFormMenu(attrs: Record<string, string>, key: string) {
  const name = attrs.name;
  const defaultValue = Array.isArray(attrs.default)
    ? attrs.default
    : typeof attrs.default === "string"
    ? attrs.default.split(",").map((v) => v.trim())
    : [];

  // 處理 options（修正這邊）
  const options = Array.isArray(attrs.options)
    ? attrs.options
    : typeof attrs.options === "string"
    ? attrs.options.split(",").map((v) => v.trim())
    : [];

  // const isMultiple = ["true", "yes", "1"].includes((attrs.multiple || "").toLowerCase());
  // const isMultiple = Boolean(multipleAttr) || multipleAttr === "true" || multipleAttr === "yes";
  const isMultiple =
    typeof attrs.multiple === "string"
      ? ["true", "yes", "1"].includes(attrs.multiple.toLowerCase())
      : Boolean(attrs.multiple);

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

  return (
    <select
      key={key}
      id={name ? `field_renderer_${name}` : undefined}
      defaultValue={defaultValue[0] || ""}
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
