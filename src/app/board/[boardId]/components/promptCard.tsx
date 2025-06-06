"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Settings2, Plus } from "lucide-react"
import { SheetClose } from "@/components/ui/sheet"
import { Prompt } from "@/types/prompt"

interface PromptCardProps {
  prompt: Prompt
  onAdd: (prompt: Prompt) => void
}

const extractContentInfo = (html: string) => {
  const formTextMatches = html.match(/data-type=\"formtext\"/g) || []
  const formMenuMatches = html.match(/data-type=\"formmenu\"/g) || []

  const interactiveCount = formTextMatches.length + formMenuMatches.length

  let cleanText = html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  if (interactiveCount <= 4) {
    cleanText = html
      .replace(/<span[^>]*data-type=\"formtext\"[^>]*><\/span>/g, " [input field] ")
      .replace(/<span[^>]*data-type=\"formmenu\"[^>]*><\/span>/g, " [dropdown menu] ")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  } else {
    cleanText = html
      .replace(/<span[^>]*data-type=\"[^\"]*\"[^>]*><\/span>/g, " [...] ")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  }

  return {
    interactiveCount,
    cleanText,
    formTextCount: formTextMatches.length,
    formMenuCount: formMenuMatches.length,
  }
}

export default function PromptCard({ prompt, onAdd }: PromptCardProps) {
  const { interactiveCount, cleanText, formTextCount, formMenuCount } = extractContentInfo(prompt.content)
  const hasInteractiveElements = interactiveCount > 0

  return (
    <Card className="w-full">
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
          </div>

          <p className="text-xs text-muted-foreground line-clamp-2">{cleanText}</p>

          {interactiveCount > 2 && (
            <div className="flex gap-2 text-xs text-muted-foreground">
              {formTextCount > 0 && <span>{formTextCount}  input fields</span>}
              {formMenuCount > 0 && <span>{formMenuCount} dropdown menus</span>}
            </div>
          )}

        <div className="flex">
          <SheetClose asChild>
            <Button size="sm" onClick={() => onAdd(prompt)} className="w-1/2 ml-auto">
              <Plus className="w-3 h-3 mr-1" />
              Add to Board
            </Button>
          </SheetClose>
        </div>
        </div>
      </CardContent>
    </Card>
  )
}
