'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Settings2 } from 'lucide-react';
import {
  extractContentInfo,
  type PromptContentInfo,
} from '@/lib/utils/promptContentInfo';
import type { BasePrompt } from './promptCard';

interface NavigationPromptCardProps {
  prompt: BasePrompt;
  href: string;
  showShortcut?: boolean;
}

export default function NavigationPromptCard({
  prompt,
  href,
  showShortcut = true,
}: NavigationPromptCardProps) {
  const {
    interactiveCount,
    cleanText,
    formTextCount,
    formMenuCount,
  }: PromptContentInfo = extractContentInfo(prompt.content, prompt.contentJSON);
  const hasInteractiveElements = interactiveCount > 0;

  return (
    <Card className="w-full hover:shadow-md transition-shadow rounded-md">
      <CardContent className="p-4">
        <Link href={href} className="block">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1">
                <h4 className="font-medium text-sm">{prompt.name}</h4>
                {hasInteractiveElements && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Settings2 className="h-3 w-3" />
                    <span className="text-xs">{interactiveCount}</span>
                  </div>
                )}
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
                {formMenuCount > 0 && (
                  <span>{formMenuCount} dropdown menus</span>
                )}
              </div>
            )}
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}
