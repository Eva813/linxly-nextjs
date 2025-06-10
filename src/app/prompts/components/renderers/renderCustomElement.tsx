import React from "react";
import { renderFormText } from "./types/formText";
import { renderFormMenu } from "./types/formMenu";

const typeToRenderer: Record<
  string,
  (attrs: Record<string, string>, key: string) => React.ReactNode
> = {
  formtext: (attrs, key) => renderFormText({ attrs, key }),
  formmenu: (attrs, key) => renderFormMenu({ attrs, key }),
};

type PromptAttribute = {
  name: string;
  value: string;
};

type Prompt = {
  attributes: PromptAttribute[];
};

export function renderCustomElement(el: HTMLElement, key: string): React.ReactNode {
  const type = el.getAttribute("data-type")?.toLowerCase();
  const prompt = el.getAttribute("data-prompt");
  if (!prompt || !type) return null;
  try {
    const parsed = JSON.parse(prompt) as Prompt;
    const attrs = parsed.attributes.reduce((acc: Record<string, string>, attr) => {
      acc[attr.name] = attr.value;
      return acc;
    }, {});
    const renderer = typeToRenderer[type];
    return renderer
      ? renderer(attrs, key)
      : <span key={key}>[Unknown type: {type}]</span>;
  } catch (err) {
    return <span key={key}>[Invalid prompt: {(err as Error).message}]</span>;
  }

  // 其他自訂節點
  // try {
  //   const parsed = JSON.parse(promptStr) as Prompt;
  //   const attrs = parsed.attributes.reduce((acc: Record<string, string>, attr) => {
  //     acc[attr.name] = attr.value;
  //     return acc;
  //   }, {});
  //   const renderer = typeToRenderer[type];
  //   return renderer
  //     ? renderer(attrs, key)
  //     : <span key={key}>[Unknown type: {type}]</span>;
  // } catch (err) {
  //   return <span key={key}>[Invalid prompt: {(err as Error).message}]</span>;
  // }
}
