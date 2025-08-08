"use client";

import React, { useCallback, useMemo } from "react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { TrashIcon } from "@radix-ui/react-icons";
import type { SpaceMenuItemProps } from "./types/promptSpaceSelector.types";

// Memo 化的 SpaceMenuItem 元件，減少不必要的重新渲染
const SpaceMenuItem = React.memo<SpaceMenuItemProps>(({ space, isCurrentSpace, onSpaceClick, onDeleteClick, index, permission }) => {
  // 使用 useCallback 穩定化事件處理函數，並加入錯誤處理
  const handleClick = useCallback(() => {
    try {
      onSpaceClick(space.id);
    } catch (error) {
      console.error('Failed to switch workspace:', error);
      // 這裡可以加入 toast 通知或其他使用者回饋機制
    }
  }, [onSpaceClick, space.id]);

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    try {
      e.stopPropagation(); // 防止觸發父元件的點擊事件
      if (onDeleteClick) {
        onDeleteClick(e, space);
      }
    } catch (error) {
      console.error('Failed to delete workspace:', error);
      // 這裡可以加入 toast 通知或其他使用者回饋機制
    }
  }, [onDeleteClick, space]);

  // 使用 useMemo 計算動態 className
  const itemClassName = useMemo(() => {
    const baseClasses = "cursor-pointer flex items-center justify-between";
    const activeClass = isCurrentSpace ? "bg-accent" : "";
    const spacingClass = index > 0 ? "mt-1" : "";
    return `${baseClasses} ${activeClass} ${spacingClass}`.trim();
  }, [isCurrentSpace, index]);

  // 使用 useMemo 優化 renderSpaceAction，避免每次渲染都重新創建
  const spaceAction = useMemo(() => {
    if (space.defaultSpace) {
      return (
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium whitespace-nowrap flex-shrink-0 ml-2">
          default
        </span>
      );
    }

    if (onDeleteClick) {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 ml-2 hover:bg-red-100 hover:text-red-600"
          onClick={handleDeleteClick}
          title="Delete workspace"
          aria-label={`Delete workspace ${space.name}`}
        >
          <TrashIcon className="h-3 w-3" />
        </Button>
      );
    }

    return null;
  }, [space.defaultSpace, space.name, onDeleteClick, handleDeleteClick]);

  return (
    <DropdownMenuItem
      key={space.id}
      onClick={handleClick}
      className={itemClassName}
      aria-label={`Switch to workspace ${space.name}${permission ? ` (${permission} access)` : ''}`}
      role="menuitem"
    >
      <div className="flex items-center flex-1 min-w-0">
        <span className="truncate">{space.name}</span>
        {permission && (
          <span 
            className="text-xs text-muted-foreground bg-gray-100 px-1 py-0.5 rounded ml-2"
            aria-label={`Access level: ${permission}`}
          >
            {permission}
          </span>
        )}
      </div>
      {spaceAction}
    </DropdownMenuItem>
  );
});

SpaceMenuItem.displayName = "SpaceMenuItem";

export default SpaceMenuItem;