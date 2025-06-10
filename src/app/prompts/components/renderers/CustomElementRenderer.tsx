import { useContext } from "react";
import { PreviewContext } from "./PreviewContext";
import { createControlledFormText } from "./types/formText";
import { createControlledFormMenu } from "./types/formMenu";
import { renderFormCalc } from "./types/formCalc";

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
    if (type === "formtext" && parsed.attributes) {
      const attrsRecord = parsed.attributes.reduce((acc, a) => {
        acc[a.name] = a.value;
        return acc;
      }, {} as Record<string, string>);
      return createControlledFormText(attrsRecord, nodeKey, values, setValues);
    }
    if (type === "formmenu" && parsed.attributes) {
      const attrsRecord = parsed.attributes.reduce((acc: Record<string, string>, a) => {
        acc[a.name] = a.value;
        return acc;
      }, {});
      return createControlledFormMenu(attrsRecord, nodeKey, values, setValues);
    }
    // calc
    if (type === "calc" && parsed.name) {
      const name = parsed.name;
      const def = parsed.default;
      return renderFormCalc({ name, defaultValue: def, key: nodeKey, isControlled: true, values, setValues });
    }
    return null;
  } catch {
    return null;
  }
}
