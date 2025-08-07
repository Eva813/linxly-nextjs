import React from "react";
import { renderFormText } from "./types/formText";
import { renderFormMenu } from "./types/formMenu";

// 定義 attrs 的可能值類型
type AttrValue = string | string[] | boolean | number;

const typeToRenderer: Record<
  string,
  (attrs: Record<string, AttrValue>, key: string) => React.ReactNode
> = {
  formtext: renderFormText,
  formmenu: renderFormMenu,
};

type PromptAttribute = {
  name: string;
  value: AttrValue;
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
    const attrs = parsed.attributes.reduce((acc: Record<string, AttrValue>, attr) => {
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
}
