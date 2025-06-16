"use client";

import React from "react";
import dynamic from "next/dynamic";
import { usePromptStore } from "@/stores/prompt";
import { useSidebarStore } from "@/stores/sidebar/sidebarStore";
import PromptList from "./promptList";
import LoadingSkeleton from "./components/loadingSkeleton";

const FolderItem = dynamic(() => import("./folderItem"), {
  ssr: false,
  loading: () => <LoadingSkeleton variant="folder" />,
});

const FolderList: React.FC = () => {
  const { folders } = usePromptStore();
  const { addingFolder } = useSidebarStore();

  return (
    <ul className="dark:text-gray-200">
      {folders.map((folder) => (
        <FolderItem key={folder.id} folder={folder}>
          <PromptList folder={folder} />
        </FolderItem>
      ))}
      {addingFolder && <LoadingSkeleton variant="folder" />}
    </ul>
  );
};

export default FolderList;
