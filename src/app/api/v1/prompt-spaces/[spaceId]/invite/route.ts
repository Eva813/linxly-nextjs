import { NextResponse } from 'next/server';
import { adminDb } from '@/server/db/firebase';

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

    const body = await req.json();
    const { permission = 'view' } = body;

    // Check if the space exists and belongs to the user
    const spaceDoc = await adminDb.collection('prompt_spaces').doc(spaceId).get();
    if (!spaceDoc.exists) {
      return NextResponse.json({ message: 'Space not found' }, { status: 404 });
    }

    const spaceData = spaceDoc.data();
    if (spaceData?.userId !== userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    // Check if universal link already exists for this space and permission
    const existingQuery = await adminDb
      .collection('space_shares')
      .where('promptSpaceId', '==', spaceId)
      .where('isUniversal', '==', true)
      .where('permission', '==', permission)
      .limit(1)
      .get();

    let shareId;
    let actualExpiresAt;
    
    if (!existingQuery.empty) {
      // Check if existing link is still valid
      const existingDoc = existingQuery.docs[0];
      const existingData = existingDoc.data();
      const existingExpiresAt = existingData.expiresAt;
      
      // Handle both Firestore Timestamp and Date objects
      const expiryDate = existingExpiresAt?.toDate ? existingExpiresAt.toDate() : new Date(existingExpiresAt);
      
      if (new Date() < expiryDate) {
        // Use existing valid link
        shareId = existingDoc.id;
        actualExpiresAt = expiryDate.toISOString();
      } else {
        // Existing link is expired, create new one
        const now = new Date();
        actualExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

        const shareRef = adminDb.collection('space_shares').doc();
        shareId = shareRef.id;

        const shareData = {
          promptSpaceId: spaceId,
          permission,
          isUniversal: true,
          createdAt: now,
          updatedAt: now,
          expiresAt: new Date(actualExpiresAt),
          createdBy: userId
        };

        await shareRef.set(shareData);
      }
    } else {
      // Create new universal link
      const now = new Date();
      actualExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const shareRef = adminDb.collection('space_shares').doc();
      shareId = shareRef.id;

      const shareData = {
        promptSpaceId: spaceId,
        permission,
        isUniversal: true,
        createdAt: now,
        updatedAt: now,
        expiresAt: new Date(actualExpiresAt),
        createdBy: userId
      };

      await shareRef.set(shareData);
    }

    // Generate the invite link
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${shareId}`;

    return NextResponse.json({
      inviteLink,
      shareId,
      permission,
      expiresAt: actualExpiresAt
    });

  } catch (error) {
    console.error('Error creating invite link:', error);
    return NextResponse.json(
      { message: 'Failed to create invite link' },
      { status: 500 }
    );
  }
}