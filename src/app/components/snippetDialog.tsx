'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useSnippetStore } from "@/stores/snippet";


interface FormField {
  id: string;  // 新增 id 欄位
  label: string;
  default: string;
  currentValue: string;
}

interface ContentSegment {
  type: 'text' | 'field';
  content: string;
  fieldId?: string;  // 只有當 type 為 'field' 時才會有值
}

const SnippetDialog = () => {
  // 改用 useSnippetStore 取得 UI 狀態與操作方法
  const { isDialogOpen, setIsDialogOpen, matchedSnippet, setMatchedSnippet } = useSnippetStore();
  const [formFields, setFormFields] = useState<{ [key: string]: FormField }>({});
  const [contentSegments, setContentSegments] = useState<ContentSegment[]>([]);

  // 去除 HTML 標籤
  const stripHtml = (html: string) => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };

  useEffect(() => {
    if (matchedSnippet.content) {
      const parseContent = () => {
        const div = document.createElement('div');
        div.innerHTML = matchedSnippet.content;

        const formTextElements = div.querySelectorAll('span[data-type="formtext"]');
        const newFormFields: { [key: string]: FormField } = {};
        const newSegments: ContentSegment[] = [];

        let currentPos = 0;
        formTextElements.forEach((span, index) => {
          const spanOuterHTML = span.outerHTML;
          // 找到 span 在 content 中的位置
          const spanIndex = matchedSnippet.content.indexOf(spanOuterHTML, currentPos);

          // 如果 span 前面還有 text，則添加到 newSegments 中
          if (spanIndex > currentPos) {
            const beforeText = matchedSnippet.content.substring(currentPos, spanIndex);
            newSegments.push({
              type: 'text',
              content: stripHtml(beforeText)
            });
          }

          // 生成唯一的字段 ID
          const fieldId = `field-${span.getAttribute('label')}-${index}`;

          // 添加表單字段
          newFormFields[fieldId] = {
            id: fieldId,
            label: span.getAttribute('label') || '',
            default: span.getAttribute('default') || '',
            currentValue: span.getAttribute('default') || ''
          };

          // 添加字段標記
          newSegments.push({
            type: 'field',
            content: '{{FIELD}}',
            fieldId
          });

          currentPos = spanIndex + spanOuterHTML.length;
        });

        // 添加剩餘的 text
        if (currentPos < matchedSnippet.content.length) {
          newSegments.push({
            type: 'text',
            content: stripHtml(matchedSnippet.content.substring(currentPos))
          });
        }

        setFormFields(newFormFields);
        setContentSegments(newSegments);
      };

      parseContent();
    }
  }, [matchedSnippet.content]);

  const handleInputChange = (fieldId: string, value: string) => {
    setFormFields(prev => ({
      ...prev,
      [fieldId]: {
        ...prev[fieldId],
        currentValue: value
      }
    }));
  };

  const handleInsert = () => {
    if (matchedSnippet.targetElement) {
      let finalContent = matchedSnippet.content;

      Object.values(formFields).forEach(field => {
        const placeholder = `<span[^>]*data-type="formtext"[^>]*label="${field.label}"[^>]*>.*?</span>`;
        const regex = new RegExp(placeholder, 'g');
        finalContent = finalContent.replace(regex, field.currentValue);
      });

      finalContent = stripHtml(finalContent);

      setMatchedSnippet({
        ...matchedSnippet,
        content: finalContent,
        insert: true
      });
      setIsDialogOpen(false);
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setMatchedSnippet({
      content: '',
      targetElement: null,
      insert: false,
      shortcut: ''
    });
    setFormFields({});
    setContentSegments([]);
  };

  const renderContent = () => {
    return contentSegments.map((segment, index) => {
      if (segment.type === 'field' && segment.fieldId) {
        const field = formFields[segment.fieldId];
        return (
          <input
            key={field.id}
            type="text"
            value={field.currentValue}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.label}
            className="bg-gray-100 px-2 py-1 rounded"
          />
        );
      }
      return <span key={`text-${index}`}>{segment.content}</span>;
    });
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="bg-white">
        <DialogTitle>Insert text field</DialogTitle>
        <DialogDescription className="hidden"></DialogDescription>
        <div className="p-4">
          <div className="mb-4">
            <h3 className="text-lg font-medium">Insert Snippet</h3>
            <div className="whitespace-pre-wrap">
              {renderContent()}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            <Button onClick={handleInsert}>Insert</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SnippetDialog;