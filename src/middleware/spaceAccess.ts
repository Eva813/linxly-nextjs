import { adminDb } from '@/server/db/firebase';

export type UserRole = 'owner' | 'edit' | 'view';

export interface SpaceAccessResult {
  hasAccess: boolean;
  role?: UserRole;
  permissions?: string[];
}

/**
 * Get user's role in a specific space
 */
export const getUserSpaceRole = async (userId: string, spaceId: string): Promise<UserRole | null> => {
  try {
    // Check if user is space owner
    const spaceDoc = await adminDb.collection('prompt_spaces').doc(spaceId).get();
    if (spaceDoc.exists && spaceDoc.data()?.userId === userId) {
      return 'owner';
    }

    // Check if user has share access
    const shareQuery = await adminDb
      .collection('space_shares')
      .where('promptSpaceId', '==', spaceId)
      .where('sharedWithUserId', '==', userId)
      .limit(1)
      .get();

    if (!shareQuery.empty) {
      return shareQuery.docs[0].data().permission as UserRole;
    }

    return null;
  } catch (error) {
    console.error('Error getting user space role:', error);
    return null;
  }
};

/**
 * Check if user has access to a space and return role info
 */
export const checkSpaceAccess = async (userId: string, spaceId: string): Promise<SpaceAccessResult> => {
  const role = await getUserSpaceRole(userId, spaceId);
  
  if (!role) {
    return { hasAccess: false };
  }

  return {
    hasAccess: true,
    role,
    permissions: getPermissionsForRole(role)
  };
};

/**
 * Get permissions array for a given role
 */
export const getPermissionsForRole = (role: UserRole): string[] => {
  const permissions = {
    owner: ['read', 'write', 'share', 'delete'],
    edit: ['read', 'write'],
    view: ['read']
  };
  return permissions[role] || [];
};

/**
 * Check if user has specific permission in a space
 */
export const hasPermission = async (
  userId: string, 
  spaceId: string, 
  permission: string
): Promise<boolean> => {
  const accessResult = await checkSpaceAccess(userId, spaceId);
  return accessResult.hasAccess && (accessResult.permissions?.includes(permission) || false);
};

/**
 * Middleware function for Next.js API routes
 */
export const spaceAccessMiddleware = async (
  userId: string,
  spaceId: string,
  requiredPermission?: string
): Promise<{ success: boolean; role?: UserRole; error?: string }> => {
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  if (!spaceId) {
    return { success: false, error: 'Space ID is required' };
  }

  const accessResult = await checkSpaceAccess(userId, spaceId);
  
  if (!accessResult.hasAccess) {
    return { success: false, error: 'No access to this space' };
  }

  if (requiredPermission && !accessResult.permissions?.includes(requiredPermission)) {
    return { success: false, error: `Insufficient permissions. Required: ${requiredPermission}` };
  }

  return { success: true, role: accessResult.role };
};

/**
 * Get all spaces accessible by user (owned + shared)
 */
export const getUserAccessibleSpaces = async (userId: string) => {
  try {
    // Get owned spaces
    const ownedSpacesQuery = await adminDb
      .collection('prompt_spaces')
      .where('userId', '==', userId)
      .get();

    const ownedSpaces = ownedSpacesQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      userRole: 'owner' as UserRole
    }));

    // Get shared spaces
    const sharedSpacesQuery = await adminDb
      .collection('space_shares')
      .where('sharedWithUserId', '==', userId)
      .get();

    const sharedSpaces = [];
    for (const shareDoc of sharedSpacesQuery.docs) {
      const shareData = shareDoc.data();
      const spaceId = shareData.promptSpaceId;
      const spaceDoc = await adminDb.collection('prompt_spaces').doc(spaceId).get();
      
      if (spaceDoc.exists) {
        sharedSpaces.push({
          id: spaceDoc.id,
          ...spaceDoc.data(),
          userRole: shareData.permission as UserRole,
          sharedBy: shareData.ownerUserId
        });
      }
    }

    return {
      ownedSpaces,
      sharedSpaces,
      allSpaces: [...ownedSpaces, ...sharedSpaces]
    };
  } catch (error) {
    console.error('Error getting user accessible spaces:', error);
    return {
      ownedSpaces: [],
      sharedSpaces: [],
      allSpaces: []
    };
  }
};

/**
 * Validate if user can perform specific actions
 */
export const validateSpaceAction = async (
  userId: string,
  spaceId: string,
  action: 'view' | 'edit' | 'share' | 'delete'
): Promise<boolean> => {
  const role = await getUserSpaceRole(userId, spaceId);
  
  if (!role) return false;

  const actionPermissions = {
    view: ['owner', 'edit', 'view'],
    edit: ['owner', 'edit'],
    share: ['owner'],
    delete: ['owner']
  };

  return actionPermissions[action]?.includes(role) || false;
};

/**
 * Get spaces where user has specific permission
 */
export const getSpacesWithPermission = async (
  userId: string,
  permission: 'view' | 'edit' | 'share' | 'delete'
): Promise<string[]> => {
  const { allSpaces } = await getUserAccessibleSpaces(userId);
  
  const spaceIds = [];
  for (const space of allSpaces) {
    const hasAccess = await validateSpaceAction(userId, space.id, permission);
    if (hasAccess) {
      spaceIds.push(space.id);
    }
  }
  
  return spaceIds;
};