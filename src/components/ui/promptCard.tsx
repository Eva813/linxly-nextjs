'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Settings2 } from 'lucide-react';
import {
  extractContentInfo,
  type PromptContentInfo,
} from '@/lib/utils/promptContentInfo';
import { ReactNode } from 'react';
import type { JSONContent } from '@tiptap/react';

export interface BasePrompt {
  id: string;
  name: string;
  content: JSONContent | string | object | null | undefined;
  contentJSON?: JSONContent | object | null | undefined;
  shortcut?: string;
}

interface PromptCardProps {
  prompt: BasePrompt;
  children?: ReactNode;
  className?: string;
  showShortcut?: boolean;
}

export default function PromptCard({
  prompt,
  children,
  className = '',
  showShortcut = true,
}: PromptCardProps) {
  const {
    interactiveCount,
    cleanText,
    formTextCount,
    formMenuCount,
  }: PromptContentInfo = extractContentInfo(prompt.content, prompt.contentJSON);
  const hasInteractiveElements = interactiveCount > 0;

  return (
    <Card className={`w-full ${className}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm">{prompt.name}</h4>
                {hasInteractiveElements && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Settings2 className="h-3 w-3" />
                    <span className="text-xs">{interactiveCount}</span>
                  </div>
                )}
              </div>
            </div>
            {showShortcut && prompt.shortcut && (
              <span className="inline-block px-2 py-1 border border-secondary dark:border-third text-xs rounded-full ml-2">
                {prompt.shortcut}
              </span>
            )}
          </div>

          <p className="text-xs text-muted-foreground line-clamp-2">
            {cleanText}
          </p>

          {interactiveCount > 2 && (
            <div className="flex gap-2 text-xs text-muted-foreground">
              {formTextCount > 0 && <span>{formTextCount} input fields</span>}
              {formMenuCount > 0 && <span>{formMenuCount} dropdown menus</span>}
            </div>
          )}

          {children && <div className="flex">{children}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
