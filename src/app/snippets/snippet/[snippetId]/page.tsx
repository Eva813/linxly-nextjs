// pages/snippets/snippet/[id].tsx
'use client';
import { useSnippets } from '@/contexts/SnippetsContext';

interface SnippetPageProps {
  params: {
    snippetId: string;
  };
}

const SnippetPage = ({ params }: SnippetPageProps) => {
  const { snippetId } = params;
  const { folders } = useSnippets();

  let currentSnippet = null;
  for (const folder of folders) {
    const snippet = folder.snippets.find(s => s.id === snippetId);
    if (snippet) {
      currentSnippet = snippet;
      break;
    }
  }

  if (!currentSnippet) {
    return <p>Snippet not found.</p>;
  }

  return (
    <div>
      <h1>{currentSnippet.name}</h1>
      <textarea defaultValue={currentSnippet.content} />
    </div>
  );
};

export default SnippetPage;