import { NextResponse } from 'next/server';
import { adminDb } from '@/server/db/firebase';

// Helper function to check if user is space owner
const isSpaceOwner = async (userId: string, spaceId: string): Promise<boolean> => {
  const spaceDoc = await adminDb.collection('prompt_spaces').doc(spaceId).get();
  return spaceDoc.exists && spaceDoc.data()?.userId === userId;
};

// Helper function to validate email format
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Helper function to chunk array for batch processing
const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

// GET /api/v1/prompt-spaces/{spaceId}/shares
// 獲取分享列表（僅 owner）
export async function GET(
  req: Request,
  { params }: { params: { spaceId: string } }
) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { spaceId } = params;
    if (!spaceId) {
      return NextResponse.json({ message: 'Space ID is required' }, { status: 400 });
    }

    // Check if user is space owner
    const isOwner = await isSpaceOwner(userId, spaceId);
    if (!isOwner) {
      return NextResponse.json({ message: 'Only space owner can view shares' }, { status: 403 });
    }

    // Get all shares for this space (exclude universal links)
    const sharesQuery = await adminDb
      .collection('space_shares')
      .where('promptSpaceId', '==', spaceId)
      .orderBy('createdAt', 'desc')
      .get();

    const shares = sharesQuery.docs
      .filter(doc => {
        const data = doc.data();
        // Exclude universal links from shares list
        return !data.isUniversal;
      })
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.sharedWithEmail,
          userId: data.sharedWithUserId || undefined,
          permission: data.permission,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        };
      });

    return NextResponse.json({
      shares,
      total: shares.length
    });

  } catch (error: unknown) {
    console.error("GET shares 錯誤:", error);
    const errorMessage = error instanceof Error ? error.message : 'unknown error';
    return NextResponse.json(
      { message: 'server error', error: errorMessage },
      { status: 500 }
    );
  }
}

// POST /api/v1/prompt-spaces/{spaceId}/shares
// 創建分享（智能批量處理）
export async function POST(
  req: Request,
  { params }: { params: { spaceId: string } }
) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { spaceId } = params;
    if (!spaceId) {
      return NextResponse.json({ message: 'Space ID is required' }, { status: 400 });
    }

    // Check if user is space owner
    const isOwner = await isSpaceOwner(userId, spaceId);
    if (!isOwner) {
      return NextResponse.json({ message: 'Only space owner can create shares' }, { status: 403 });
    }

    const body = await req.json();
    const { shares } = body;

    if (!shares || !Array.isArray(shares)) {
      return NextResponse.json({ message: 'Shares array is required' }, { status: 400 });
    }

    if (shares.length > 50) {
      return NextResponse.json({ message: 'Maximum 50 shares per request' }, { status: 400 });
    }

    const results = {
      success: [] as { email: string; shareId: string; inviteLink: string }[],
      failed: [] as { email: string; reason: string }[],
      summary: { total: shares.length, successful: 0, failed: 0 }
    };

    // Check current share count
    const currentSharesQuery = await adminDb
      .collection('space_shares')
      .where('promptSpaceId', '==', spaceId)
      .get();

    if (currentSharesQuery.size >= 500) {
      return NextResponse.json({ 
        message: 'Space sharing limit reached (500 users)' 
      }, { status: 400 });
    }

    // Process shares in batches
    const BATCH_SIZE = 25;
    const batches = chunk(shares, BATCH_SIZE);

    for (const batch of batches) {
      const firestoreBatch = adminDb.batch();
      
      for (const { email, permission } of batch) {
        try {
          // Validate email format
          if (!isValidEmail(email)) {
            results.failed.push({ email, reason: 'Invalid email format' });
            continue;
          }

          // Validate permission
          if (!['view', 'edit'].includes(permission)) {
            results.failed.push({ email, reason: 'Invalid permission' });
            continue;
          }

          // Check if already shared
          const existingQuery = await adminDb
            .collection('space_shares')
            .where('promptSpaceId', '==', spaceId)
            .where('sharedWithEmail', '==', email)
            .limit(1)
            .get();

          if (!existingQuery.empty) {
            results.failed.push({ email, reason: 'Already shared' });
            continue;
          }

          // Check if trying to share with space owner
          const spaceDoc = await adminDb.collection('prompt_spaces').doc(spaceId).get();
          const spaceOwnerEmail = await adminDb
            .collection('users')
            .doc(spaceDoc.data()?.userId)
            .get()
            .then(doc => doc.data()?.email);

          if (email === spaceOwnerEmail) {
            results.failed.push({ email, reason: 'Cannot share with space owner' });
            continue;
          }

          // Check total shares limit
          if (currentSharesQuery.size + results.success.length >= 500) {
            results.failed.push({ email, reason: 'Space sharing limit reached (500 users)' });
            continue;
          }

          // Check if user exists and get userId
          const userQuery = await adminDb
            .collection('users')
            .where('email', '==', email)
            .limit(1)
            .get();

          const sharedWithUserId = userQuery.empty ? undefined : userQuery.docs[0].id;

          // Create share record
          const shareRef = adminDb.collection('space_shares').doc();
          const shareData: {
            promptSpaceId: string;
            ownerUserId: string;
            sharedWithEmail: string;
            permission: string;
            createdAt: Date;
            updatedAt: Date;
            sharedWithUserId?: string;
          } = {
            promptSpaceId: spaceId,
            ownerUserId: userId,
            sharedWithEmail: email,
            permission,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          // Only add sharedWithUserId if user exists
          if (sharedWithUserId) {
            shareData.sharedWithUserId = sharedWithUserId;
          }

          firestoreBatch.set(shareRef, shareData);

          // Generate invite link
          const inviteLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/invite/${shareRef.id}`;
          results.success.push({
            email,
            shareId: shareRef.id,
            inviteLink
          });

        } catch (error) {
          results.failed.push({ 
            email, 
            reason: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      // Execute batch write
      if (results.success.length > 0) {
        await firestoreBatch.commit();
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Update summary
    results.summary.successful = results.success.length;
    results.summary.failed = results.failed.length;

    return NextResponse.json(results);

  } catch (error: unknown) {
    console.error("POST shares 錯誤:", error);
    const errorMessage = error instanceof Error ? error.message : 'unknown error';
    return NextResponse.json(
      { message: 'server error', error: errorMessage },
      { status: 500 }
    );
  }
}

// PUT /api/v1/prompt-spaces/{spaceId}/shares
// 批量更新權限（僅 owner）
export async function PUT(
  req: Request,
  { params }: { params: { spaceId: string } }
) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { spaceId } = params;
    if (!spaceId) {
      return NextResponse.json({ message: 'Space ID is required' }, { status: 400 });
    }

    // Check if user is space owner
    const isOwner = await isSpaceOwner(userId, spaceId);
    if (!isOwner) {
      return NextResponse.json({ message: 'Only space owner can update shares' }, { status: 403 });
    }

    const body = await req.json();
    const { shares } = body;

    if (!shares || !Array.isArray(shares)) {
      return NextResponse.json({ message: 'Shares array is required' }, { status: 400 });
    }

    if (shares.length > 30) {
      return NextResponse.json({ message: 'Maximum 30 shares per update request' }, { status: 400 });
    }

    const results = {
      updated: [] as string[],
      failed: [] as { email: string; reason: string }[]
    };

    // Process updates in batches
    const BATCH_SIZE = 15;
    const batches = chunk(shares, BATCH_SIZE);

    for (const batch of batches) {
      const firestoreBatch = adminDb.batch();

      for (const { email, permission } of batch) {
        try {
          // Validate permission
          if (!['view', 'edit'].includes(permission)) {
            results.failed.push({ email, reason: 'Invalid permission' });
            continue;
          }

          // Find existing share
          const shareQuery = await adminDb
            .collection('space_shares')
            .where('promptSpaceId', '==', spaceId)
            .where('sharedWithEmail', '==', email)
            .limit(1)
            .get();

          if (shareQuery.empty) {
            results.failed.push({ email, reason: 'Share not found' });
            continue;
          }

          const shareDoc = shareQuery.docs[0];
          firestoreBatch.update(shareDoc.ref, {
            permission,
            updatedAt: new Date()
          });

          results.updated.push(email);

        } catch (error) {
          results.failed.push({ 
            email, 
            reason: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      // Execute batch update
      if (results.updated.length > 0) {
        await firestoreBatch.commit();
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return NextResponse.json(results);

  } catch (error: unknown) {
    console.error("PUT shares 錯誤:", error);
    const errorMessage = error instanceof Error ? error.message : 'unknown error';
    return NextResponse.json(
      { message: 'server error', error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/prompt-spaces/{spaceId}/shares
// 批量刪除分享（僅 owner）
export async function DELETE(
  req: Request,
  { params }: { params: { spaceId: string } }
) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { spaceId } = params;
    if (!spaceId) {
      return NextResponse.json({ message: 'Space ID is required' }, { status: 400 });
    }

    // Check if user is space owner
    const isOwner = await isSpaceOwner(userId, spaceId);
    if (!isOwner) {
      return NextResponse.json({ message: 'Only space owner can delete shares' }, { status: 403 });
    }

    const body = await req.json();
    const { emails } = body;

    if (!emails || !Array.isArray(emails)) {
      return NextResponse.json({ message: 'Emails array is required' }, { status: 400 });
    }

    if (emails.length > 50) {
      return NextResponse.json({ message: 'Maximum 50 emails per delete request' }, { status: 400 });
    }

    const results = {
      deleted: [] as string[],
      failed: [] as { email: string; reason: string }[]
    };

    // Process deletions in batches
    const BATCH_SIZE = 25;
    const batches = chunk(emails, BATCH_SIZE);

    for (const batch of batches) {
      const firestoreBatch = adminDb.batch();

      for (const email of batch) {
        try {
          // Find existing share
          const shareQuery = await adminDb
            .collection('space_shares')
            .where('promptSpaceId', '==', spaceId)
            .where('sharedWithEmail', '==', email)
            .limit(1)
            .get();

          if (shareQuery.empty) {
            results.failed.push({ email, reason: 'Share not found' });
            continue;
          }

          const shareDoc = shareQuery.docs[0];
          firestoreBatch.delete(shareDoc.ref);

          results.deleted.push(email);

        } catch (error) {
          results.failed.push({ 
            email, 
            reason: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      // Execute batch deletion
      if (results.deleted.length > 0) {
        await firestoreBatch.commit();
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return NextResponse.json(results);

  } catch (error: unknown) {
    console.error("DELETE shares 錯誤:", error);
    const errorMessage = error instanceof Error ? error.message : 'unknown error';
    return NextResponse.json(
      { message: 'server error', error: errorMessage },
      { status: 500 }
    );
  }
}