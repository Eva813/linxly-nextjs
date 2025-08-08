"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { usePromptStore } from "@/stores/prompt";
import { useSidebarStore } from "@/stores/sidebar";
import PromptList from "./promptList";
import LoadingSkeleton from "./components/loadingSkeleton";

const FolderItem = dynamic(() => import("./folderItem"), {
  ssr: false,
  loading: () => <LoadingSkeleton variant="folder" />,
});

const FolderListComponent: React.FC = () => {
  const folders = usePromptStore(state => state.folders);
  const isCreatingFolder = useSidebarStore(state => state.isCreatingFolder);

  const folderItems = useMemo(() => 
    folders.map((folder) => (
      <FolderItem key={folder.id} folder={folder}>
        <PromptList folder={folder} />
      </FolderItem>
    )),
    [folders]
  );

  return (
    <ul className="dark:text-gray-200">
      {folderItems}
      {isCreatingFolder && <LoadingSkeleton variant="folder" />}
    </ul>
  );
};

const FolderList = React.memo(FolderListComponent);

export default FolderList;
