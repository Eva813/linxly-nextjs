export interface PromptSpaceSelectorProps {
  onCreateSpace: () => void;
}

export interface SpaceMenuItemProps {
  space: {
    id: string;
    name: string;
    defaultSpace?: boolean;
  };
  isCurrentSpace: boolean;
  onSpaceClick: (spaceId: string) => void;
  onDeleteClick?: (e: React.MouseEvent, space: { id: string; name: string }) => void;
  index: number;
  permission?: 'view' | 'edit';
}

export interface SpaceInfo {
  id: string;
  name: string;
}