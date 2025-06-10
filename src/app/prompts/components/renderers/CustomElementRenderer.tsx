import React, { useContext, cloneElement } from "react";
import { PreviewContext } from "./PreviewContext";
// import  renderFormText  from "./types/formText";
import FormTextPreview from "./FormTextPreview";
import { renderFormMenu } from "./types/formMenu";
import FormCalcPreview from "./FormCalcPreview";

interface CustomElementRendererProps {
  el: HTMLElement;
  nodeKey: string;
}

export default function CustomElementRenderer({ el, nodeKey }: CustomElementRendererProps) {
  const { values, setValues } = useContext(PreviewContext);
  const type = el.getAttribute("data-type")?.toLowerCase();
  const prompt = el.getAttribute("data-prompt");
  if (!prompt || !type) return null;
  try {
    const parsed = JSON.parse(prompt) as { attributes?: { name: string; value: string }[]; name?: string; default?: string };
    // formtext: 使用 FormTextPreview
  	if (type === "formtext" && parsed.attributes) {
      const attrsRecord = parsed.attributes.reduce((acc, a) => {
        acc[a.name] = a.value;
        return acc;
      }, {} as Record<string, string>);
      // 改用 FormTextPreview
      return <FormTextPreview key={nodeKey} name={attrsRecord.name} defaultValue={attrsRecord.default} />;
    }
    // formmenu: 使用 types/formMenu.tsx 並轉為受控
    if (type === "formmenu" && parsed.attributes) {
      const attrsRecord = parsed.attributes.reduce((acc: Record<string, string>, a) => {
        acc[a.name] = a.value;
        return acc;
      }, {});
      const name = attrsRecord.name;
      const def = attrsRecord.default;
      const element = renderFormMenu(attrsRecord, nodeKey) as React.ReactElement;
      // 判斷 multiple 模式
      const isMultiple = typeof attrsRecord.multiple === "string"
        ? ["true", "yes", "1"].includes(attrsRecord.multiple.toLowerCase())
        : Boolean(attrsRecord.multiple);
      if (isMultiple) {
        return cloneElement(element, {
          value: values[name] ?? def,
          onChange: (newVals: string[]) => setValues(prev => ({ ...prev, [name]: newVals })),
        });
      }
      // 單選 select
      return cloneElement(element, {
        value: values[name] ?? def,
        onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setValues(prev => ({ ...prev, [name]: e.target.value })),
      });
    }
    // calc
    if (type === "calc" && parsed.name) {
      const name = parsed.name;
      const def = parsed.default;
      return <FormCalcPreview key={nodeKey} name={name} default={def} />;
    }
    return null;
  } catch {
    return null;
  }
}
