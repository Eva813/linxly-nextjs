'use client';

import BoardPromptCard from '@/components/ui/boardPromptCard';
import { Prompt } from '@/types/prompt';

interface PromptCardProps {
  prompt: Prompt;
  onAdd: (prompt: Prompt) => void;
}

export default function PromptCard({ prompt, onAdd }: PromptCardProps) {
  return <BoardPromptCard prompt={prompt} onAdd={(p) => onAdd(p as Prompt)} />;
}
