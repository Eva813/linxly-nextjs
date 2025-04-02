import React from "react";

export function renderFormText(attrs: Record<string, string>, key: string) {
  return (
    <input
      key={key}
      placeholder={attrs.name || "Label"}
      defaultValue={attrs.default || ""}
      className="border border-gray-400 bg-light px-2 py-1 rounded"
    />
  );
}
