import DOMPurify from "dompurify";

export function parseHtml(content: string): HTMLElement | null {
  const cleanHTML = DOMPurify.sanitize(`<div>${content}</div>`);
  const parser = new DOMParser();
  const doc = parser.parseFromString(cleanHTML, "text/html");
  return doc.body.firstElementChild as HTMLElement | null;
}
