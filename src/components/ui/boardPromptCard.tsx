'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { SheetClose } from '@/components/ui/sheet';
import PromptCard, { type BasePrompt } from './promptCard';

interface BoardPromptCardProps {
  prompt: BasePrompt;
  onAdd: (prompt: BasePrompt) => void;
}

export default function BoardPromptCard({
  prompt,
  onAdd,
}: BoardPromptCardProps) {
  return (
    <PromptCard prompt={prompt} showShortcut={false}>
      <SheetClose asChild>
        <Button
          size="sm"
          onClick={() => onAdd(prompt)}
          className="w-1/2 ml-auto"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add to Board
        </Button>
      </SheetClose>
    </PromptCard>
  );
}
