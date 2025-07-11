"use client";

import React, { useEffect } from "react";
import { usePromptSpaceStore } from "@/stores/promptSpace";
import { usePromptSpaceActions } from "@/hooks/promptSpace";
import { usePromptStore } from "@/stores/prompt";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon, PlusIcon } from "@radix-ui/react-icons";
import { FaSpinner } from "react-icons/fa";

interface PromptSpaceSelectorProps {
  onCreateSpace: () => void;
}

const PromptSpaceSelector: React.FC<PromptSpaceSelectorProps> = ({ onCreateSpace }) => {
  const { 
    spaces, 
    currentSpaceId, 
    setCurrentSpace, 
    getCurrentSpace, 
    isLoading 
  } = usePromptSpaceStore();
  const { fetchSpaces } = usePromptSpaceActions();
  const { fetchFolders } = usePromptStore();

  const currentSpace = getCurrentSpace();

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  // When currentSpaceId changes, fetch folders for that space
  useEffect(() => {
    if (currentSpaceId) {
      fetchFolders(currentSpaceId);
    }
  }, [currentSpaceId, fetchFolders]);

  const handleSpaceChange = (spaceId: string) => {
    setCurrentSpace(spaceId);
  };

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex-1 justify-between h-8 text-sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <>
                  <span className="truncate">
                    {currentSpace?.name || "工作空間"}
                  </span>
                  <ChevronDownIcon className="h-4 w-4" />
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 p-2 mt-2">
            {spaces.map((space, index) => (
              <DropdownMenuItem
                key={space.id}
                onClick={() => handleSpaceChange(space.id)}
                className={`cursor-pointer ${
                  currentSpaceId === space.id ? "bg-accent" : ""
                } ${index > 0 ? "mt-1" : ""}`}
              >
                {space.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onCreateSpace}
          className="h-8 w-8 p-0"
          disabled={isLoading}
        >
          <PlusIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default PromptSpaceSelector;