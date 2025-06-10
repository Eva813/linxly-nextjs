// components/SigmaTags.tsx
"use client";

import React, { useEffect, useState } from "react";
import { usePromptStore } from "@/stores/prompt";
import { useParams } from "next/navigation";
import { Editor } from "@tiptap/react";

interface IconTitleDescriptionProps {
  icon?: React.ReactNode;
  editor: Editor | null; // 新增 editor prop
}

export default function SigmaTags({
  icon, // Destructure icon prop
  editor, // 接收 editor 實例
}: IconTitleDescriptionProps) {
  const params = useParams();
  const promptId = params?.promptId as string; // Safely extract promptId and cast to string
  const { folders } = usePromptStore();
  const [tags, setTags] = useState<{ name: string; default?: string }[]>([]);

  useEffect(() => {
    const extractedTags: { name: string; default?: string }[] = [];
    console.log("Folders data:", folders);
    const currentPrompt = folders.flatMap((folder) => folder.prompts).find((prompt) => prompt.id === promptId);
    console.log("Current prompt:", currentPrompt);

    if (currentPrompt) {
      const regex = /data-type=\"(formmenu|formtext)\".*?data-prompt=\"(.*?)\"/g;
      let match;
      while ((match = regex.exec(currentPrompt.content)) !== null) {
        try {
          const promptDataString = match[2].replace(/&quot;/g, '"');
          const promptData = JSON.parse(promptDataString);
          console.log("Parsed promptData:", promptData);
          const nameAttr = promptData.attributes?.find((attr: { name: string; value: string }) => attr.name === "name");
          const defaultAttr = promptData.attributes?.find((a: { name: string; value: string }) => a.name === "default");
          if (nameAttr?.value) {
            extractedTags.push({
              name: nameAttr.value,
              default: defaultAttr?.value,
            });
          }
        } catch (error) {
          console.error("Failed to parse data-prompt JSON:", error, "Raw data-prompt:", match[2]);
        }
      }
    }

    setTags(extractedTags); // Convert to string array if needed
  }, [folders, promptId]);

  const handleTagClick = (tag: { name: string; default?: string }) => {
    console.log(`Tag clicked: ${tag}`);
    if (editor) {
      editor.chain().focus().insertContent({
        type: "calc",
        attrs: {
          promptData: {
            name: tag.name,
            default: tag.default,
          },
        },
      }).run();
    } else {
      console.error("Editor instance not found");
    }
  };

  //   const handleTagClick = (tag: { name: string; default: string }) => {
  //   console.log(`Tag clicked: ${tag.name}`);
  //   if (editor) {
  //     editor.chain().focus().insertContent({
  //       type: "calc",
  //       attrs: {
  //         promptData: {
  //           name: tag,
  //           default: tag.default,
  //         },
  //       },
  //     }).run();
  //   } else {
  //     console.error("Editor instance not found");
  //   }
  // };

  // attribute 是 { name: string; value: string }[] (name 固定為 formula)
  return (
    <div className="flex items-center space-x-2 bg-white p-4">
      {/* Σ icon on the left */}
      <div className="flex flex-col justify-center text-gray-600">{icon}</div>

      {/* Pill tags on the right */}
      <div className="flex items-center flex-wrap space-x-2 my-1">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full mb-1 cursor-pointer hover:bg-gray-200"
            onClick={() => handleTagClick(tag)}
          >
            {tag.name}
          </span>
        ))}
      </div>
    </div>
  );
}
