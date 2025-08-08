import { useState, useCallback } from "react";
import type { SpaceInfo } from "../types/promptSpaceSelector.types";

export const useSpaceDialogs = () => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [spaceToDelete, setSpaceToDelete] = useState<SpaceInfo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

  const openDeleteDialog = useCallback((space: SpaceInfo) => {
    setSpaceToDelete(space);
    setDeleteDialogOpen(true);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false);
    setSpaceToDelete(null);
  }, []);

  const openSettingsDialog = useCallback(() => {
    setSettingsDialogOpen(true);
  }, []);

  const closeSettingsDialog = useCallback(() => {
    setSettingsDialogOpen(false);
  }, []);

  return {
    // Delete dialog
    deleteDialogOpen,
    spaceToDelete,
    isDeleting,
    setIsDeleting,
    openDeleteDialog,
    closeDeleteDialog,
    // Settings dialog
    settingsDialogOpen,
    openSettingsDialog,
    closeSettingsDialog,
  };
};