import React from "react";
import { renderFormText } from "./types/formText";
import { renderFormMenu } from "./types/formMenu";

const typeToRenderer: Record<
  string,
  (attrs: Record<string, string>, key: string) => React.ReactNode
> = {
  formtext: renderFormText,
  formmenu: renderFormMenu,
};

type SnippetAttribute = {
  name: string;
  value: string;
};

type Snippet = {
  attributes: SnippetAttribute[];
};

export function renderCustomElement(el: HTMLElement, key: string): React.ReactNode {
  const type = el.getAttribute("data-type")?.toLowerCase();
  const snippet = el.getAttribute("data-snippet");
  if (!snippet || !type) return null;

  try {
    const parsed = JSON.parse(snippet) as Snippet;
    const attrs = parsed.attributes.reduce((acc: Record<string, string>, attr) => {
      acc[attr.name] = attr.value;
      return acc;
    }, {});

    const renderer = typeToRenderer[type];
    return renderer
      ? renderer(attrs, key)
      : <span key={key}>[Unknown type: {type}]</span>;
  } catch (err) {
    return <span key={key}>[Invalid snippet: {(err as Error).message}]</span>;
  }
}
