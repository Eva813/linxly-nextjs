import React from "react";

type AttrValue = string | string[] | boolean | number;

export function renderFormText(attrs: Record<string, AttrValue>, key: string) {
  return (
    <input
      key={key}
      placeholder={String(attrs.name || "Label")}
      defaultValue={String(attrs.default || "")}
      className="border border-gray-400 bg-light px-2 py-1 rounded"
    />
  );
}
