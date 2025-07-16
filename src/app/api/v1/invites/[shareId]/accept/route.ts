import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/server/db/firebase';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(
  req: NextRequest,
  { params }: { params: { shareId: string } }
) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Verify user exists
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const userData = userDoc.data();

    const { shareId } = params;
    if (!shareId) {
      return NextResponse.json({ error: 'Share ID is required' }, { status: 400 });
    }

    // Get the share document
    const shareDoc = await adminDb.collection('space_shares').doc(shareId).get();
    if (!shareDoc.exists) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    const shareData = shareDoc.data();
    if (!shareData) {
      return NextResponse.json({ error: 'Invalid share data' }, { status: 400 });
    }

    // Check if invite is expired (30 days)
    const createdAt = shareData.createdAt?.toDate() || new Date();
    const expiryDate = new Date(createdAt.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    if (new Date() > expiryDate) {
      return NextResponse.json({ error: 'Invite has expired' }, { status: 410 });
    }

    // Check if share is still active
    if (shareData.status !== 'active') {
      return NextResponse.json({ error: 'Share is no longer active' }, { status: 410 });
    }

    // Get space info for owner first (we'll need it anyway)
    const spaceId = shareData.promptSpaceId;
    if (!spaceId) {
      return NextResponse.json({ error: 'Invalid space ID' }, { status: 400 });
    }
    const spaceDoc = await adminDb.collection('prompt_spaces').doc(spaceId).get();
    const spaceData = spaceDoc.data();
    const ownerId = spaceData?.userId;

    if (!ownerId) {
      return NextResponse.json({ error: 'Space owner not found' }, { status: 500 });
    }

    // Use parallel queries to improve performance
    const [invitedUserQuery, existingShareQuery] = await Promise.all([
      // For universal links, check if user is in the invite list
      shareData.isUniversal ? adminDb
        .collection('space_shares')
        .where('promptSpaceId', '==', spaceId)
        .where('sharedWithEmail', '==', userData?.email || '')
        .where('status', '==', 'active')
        .limit(1)
        .get() : null,
      
      // Check if user already has access to prevent duplicates
      adminDb
        .collection('space_shares')
        .where('promptSpaceId', '==', spaceId)
        .where('sharedWithUserId', '==', userId)
        .where('status', '==', 'active')
        .limit(1)
        .get()
    ]);

    // Check universal link access
    if (shareData.isUniversal) {
      const userEmail = userData?.email;
      if (!userEmail) {
        return NextResponse.json({ error: 'User email is required' }, { status: 400 });
      }
      
      if (!invitedUserQuery || invitedUserQuery.empty) {
        return NextResponse.json({ 
          error: 'You are not invited to this space. Please contact the space owner for access.' 
        }, { status: 403 });
      }
    }

    // Check if user already has access
    if (!existingShareQuery.empty) {
      // User already has access, just redirect
      return NextResponse.json({
        success: true,
        spaceId: spaceId,
        permission: shareData.permission,
        redirectUrl: `/prompts?space=${spaceId}`
      });
    }

    // Create a new personal share record for the user (don't modify the universal link)
    const newShareRef = adminDb.collection('space_shares').doc();
    const newShareData: {
      promptSpaceId: string;
      permission: string;
      sharedWithUserId: string;
      sharedWithEmail: string;
      status: string;
      createdAt: ReturnType<typeof FieldValue.serverTimestamp>;
      updatedAt: ReturnType<typeof FieldValue.serverTimestamp>;
      acceptedAt: ReturnType<typeof FieldValue.serverTimestamp>;
      sourceInviteId: string;
      ownerUserId?: string;
    } = {
      promptSpaceId: spaceId,
      permission: shareData.permission,
      sharedWithUserId: userId,
      sharedWithEmail: userData?.email || '',
      status: 'active',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      acceptedAt: FieldValue.serverTimestamp(),
      sourceInviteId: shareId // Reference to the universal invite
    };

    // Only add ownerUserId if we have a valid value
    if (ownerId) {
      newShareData.ownerUserId = ownerId;
    }

    await newShareRef.set(newShareData);

    return NextResponse.json({
      success: true,
      spaceId: shareData.spaceId,
      permission: shareData.permission,
      redirectUrl: `/prompts?space=${shareData.spaceId}`
    });

  } catch (error) {
    console.error('Error accepting invite:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}