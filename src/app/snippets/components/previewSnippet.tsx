"use client";
import React,{ useState, useEffect } from "react";
import DOMPurify from 'dompurify';
import { FiChevronDown } from "react-icons/fi";

interface PreviewSnippetProps {
  content: string; // 接收 content 作為 prop
  shortcut: string;
}
type SnippetAttribute = {
  name: string;
  value: string;
};

type Snippet = {
  attributes: SnippetAttribute[];
};
const FormMenuMultiSelect = ({
  options,
  defaultValue,
  name,
  customKey
}: {
  options: string[];
  defaultValue: string[];
  name?: string;
  customKey: string;
}) => {
  const [selected, setSelected] = useState<string[]>(defaultValue);
  const [open, setOpen] = useState<boolean>(false);

  const toggleOption = (opt: string) => {
    setSelected((prev) =>
      prev.includes(opt)
        ? prev.filter((v) => v !== opt)
        : [...prev, opt]
    );
  };

  const toggleDropdown = () => setOpen((prev) => !prev);

  return (
    <div className="relative inline-block">
      <div className="flex items-center" id={`field_renderer_${name ?? "auto_name"}_${customKey}`}>
        {/* 輸入框 + 向下箭頭圖示 */}
        <div className="relative inline-block">
          <button
            type="button"
            onClick={toggleDropdown}
            className="flex items-center relative w-32"
            id={`field_renderer_${name ?? "auto_name"}_${customKey}`}
          >
            <input
              readOnly
              value={selected.join(", ")}
              className="w-full py-1 px-3 border border-gray-300 rounded bg-slate-100 cursor-pointer pr-8 focus:outline-none"
            />
            <FiChevronDown className="absolute right-2 text-gray-600" size={18} />
          </button>
        </div>
      </div>
      {open && (
        <div className="absolute z-10 w-full mt-1 bg-white border shadow-md rounded p-2 max-h-60 overflow-auto">
          {options.map((opt, i) => (
            <label
              key={i}
              className="flex items-center space-x-2 py-1 hover:bg-gray-100 px-2 rounded"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggleOption(opt)}
                className="accent-blue-500"
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

const PreviewSnippet: React.FC<PreviewSnippetProps> = ({ content, shortcut }) => {
  console.log('content', content);
  const [rendered, setRendered] = useState<React.ReactNode | null>(null);

  // 元件工廠：根據 data-type 回傳對應 React 元件
  const renderCustomElement = (el: HTMLElement, key: string): React.ReactNode => {
    const type = el.getAttribute("data-type");
    const snippet = el.getAttribute("data-snippet");
    if (!snippet) return null;
  
    try {
      const parsed = JSON.parse(snippet) as Snippet;
      const attrs = parsed.attributes.reduce((acc: Record<string, string>, attr) => {
        acc[attr.name] = attr.value;
        return acc;
      }, {});
  
      switch (type) {
        case "formtext":
          return (
            <input
              key={key}
              placeholder={attrs.name || "Label"}
              defaultValue={attrs.default || ""}
              className="border border-gray-400 bg-slate-100 px-2 py-1 rounded"
            />
          );
  
  
        case "formdate":
          return (
            <input
              key={key}
              type="date"
              defaultValue={attrs.default || ""}
              className="border border-gray-400 bg-blue-100 px-2 py-1 rounded"
            />
          );

          case "formmenu":
            console.log('parsed.attributes', parsed.attributes);
            const nameAttr = parsed.attributes.find((a) => a.name === "name")?.value;
            const defaultAttr = parsed.attributes.find((a) => a.name === "default")?.value;
            const multipleAttr = parsed.attributes.find((a) => a.name === "multiple")?.value;
            const optionsAttr = parsed.attributes.find((a) => a.name === "options")?.value;

            // 確認傳入的值是否為多選
            const isMultiple = Boolean(multipleAttr) || multipleAttr === "true" || multipleAttr === "yes";

            const options: string[] = Array.isArray(optionsAttr)
              ? optionsAttr
              : typeof optionsAttr === "string"
              ? optionsAttr.split(",").map((s) => s.trim())
              : [];

            const defaultValue: string[] = Array.isArray(defaultAttr)
              ? defaultAttr
              : typeof defaultAttr === "string"
              ? defaultAttr.split(",").map((v) => v.trim())
              : [];

            if (isMultiple) {
              return (
                <FormMenuMultiSelect
                  key={key}
                  customKey={key}
                  options={options}
                  defaultValue={defaultValue}
                  name={nameAttr}
                />
              );
            }

            // 單選版本
            return (
              <select
                key={key}
                id={nameAttr ? `field_renderer_${nameAttr}` : undefined}
                defaultValue={defaultValue[0] || ""}
                className="border border-gray-400 bg-slate-100 px-2 py-1 rounded"
              >
                {options.map((opt, i) => (
                  <option key={i} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            );
        default:
          return <span key={key}>[Unknown form type: {type}]</span>;
      }
    } catch (err) {
      return <span key={key}>[Invalid snippet: {(err as Error).message}]</span>;
    }
  };
  
  // 遞迴渲染 HTML DOM -> React 元件
  const renderNode = (node: ChildNode, key: string): React.ReactNode => {
    // 針對 Node 的屬性
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }
  
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      console.log('elllll', key);
      // 如果是客製化元件，交由 renderCustomElement 處理
      if (el.tagName === "SPAN" && el.hasAttribute("data-type")) {
        return renderCustomElement(el, key);
      }
  
      // 遞迴處理子節點
      const children = Array.from(el.childNodes).map((child, i) =>
        renderNode(child, `${key}-${i}`)
      );
  
      const Tag = el.tagName.toLowerCase();
      return React.createElement(Tag, { key, className: "my-1" }, children);
    }
  
    return null;
  };
  
  // content 轉換為 React 元件
  const handleTransform = () => {
    const cleanHTML = DOMPurify.sanitize(`<div>${content}</div>`);

    const parser = new DOMParser();
    const doc = parser.parseFromString(cleanHTML, "text/html");
    const root = doc.body.firstChild;
    if (!root) return;
  
    const children = Array.from(root.childNodes).map((child, i) =>
      renderNode(child, `root-${i}`)
    );
  
    setRendered(children);
  };

  useEffect(() => {
    if (content) {
      handleTransform();
    }
  }, [content]);

  return (
    <main className="p-4 space-y-4 w-full h-[calc(100vh-120px)] flex flex-col">
      {/* Top grey bars */}
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="flex items-center">
        <p className="h-4 bg-gray-200 rounded w-1/3 mr-2" />
        <div className="inline-flex items-center rounded-full border border-blue-300 bg-white px-3 text-sm text-gray-700">
          {shortcut}
        </div>
      </div>
      {/* Dashed container with instruction text */}
      <div className="mt-4 border-2 border-dashed p-4 overflow-y-auto flex-1">{rendered}</div>
    </main>
  );
}

export default PreviewSnippet;