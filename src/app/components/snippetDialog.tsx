'use client';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useSnippets } from '@/contexts/SnippetsContext';
import { useState, useEffect } from 'react';

const SnippetDialog = () => {
  const {
    isDialogOpen,
    setIsDialogOpen,
    matchedSnippet,
    setMatchedSnippet
  } = useSnippets();
  const [parsedContent, setParsedContent] = useState<string>('');
  useEffect(() => {
    // 解析 HTML 內容並將 <span data-type="formtext"> 轉換為 <input> 元素
    const parseContent = (content: string) => {
      const div = document.createElement('div');
      div.innerHTML = content;

      // 查找所有 <span data-type="formtext"> 標籤並替換為 <input>
      const formTextElements = div.querySelectorAll('span[data-type="formtext"]');
      formTextElements.forEach((span) => {
        const spanElement = span as HTMLElement;
        const input = document.createElement('input');
        const defaultValue = spanElement.getAttribute('defaultvalue') || '';
        input.setAttribute('value', defaultValue); // Changed: Set value using setAttribute
        input.placeholder = spanElement.getAttribute('label') || '';
        input.style.backgroundColor = '#f0f0f0';
        spanElement.replaceWith(input); // 替換 span 為 input
      });

      return div.innerHTML;
    };

    setParsedContent(parseContent(matchedSnippet.content));
  }, [matchedSnippet.content]);

  const handleInsert = () => {
    if (matchedSnippet.targetElement) {
      const target = matchedSnippet.targetElement;
      const newValue = target.value + matchedSnippet.content;
      target.value = newValue;
      setIsDialogOpen(false);
      setMatchedSnippet({ content: '', targetElement: null });
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="bg-white">
        <DialogTitle>Insert text field</DialogTitle>
        <DialogDescription className='hidden'>
        </DialogDescription>
        <div className="p-4">
          <div className="mb-4">
            <h3 className="text-lg font-medium">Insert Snippet</h3>
            {/* <p className="whitespace-pre-wrap">{matchedSnippet.content}</p> */}
            {/* 這裡使用 dangerouslySetInnerHTML 渲染 HTML 內容 */}
            <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: parsedContent }} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInsert}>Insert</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SnippetDialog;
