import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/server/db/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { getCacheConfig } from '@/config/cache';

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
    const expiryDate = getCacheConfig().inviteLinkExpiresAt(createdAt);
    
    if (new Date() > expiryDate) {
      return NextResponse.json({ error: 'Invite has expired' }, { status: 410 });
    }

    // Note: If record exists, share is valid (deleted records are truly deleted)

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
    const [existingShareQuery, emailInviteQuery] = await Promise.all([
      // Check if user already has access to prevent duplicates
      adminDb
        .collection('space_shares')
        .where('promptSpaceId', '==', spaceId)
        .where('sharedWithUserId', '==', userId)
        .limit(1)
        .get(),
      
      // For universal links, check if user's email is in the share records list
      shareData.isUniversal ? adminDb
        .collection('space_shares')
        .where('promptSpaceId', '==', spaceId)
        .where('sharedWithEmail', '==', userData?.email || '')
        .limit(1)
        .get() : null
    ]);

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

    // Handle universal link access
    if (shareData.isUniversal) {
      const userEmail = userData?.email;
      if (!userEmail) {
        return NextResponse.json({ error: 'User email is required' }, { status: 400 });
      }
      
      // Check if user's email is in the share records list
      if (!emailInviteQuery || emailInviteQuery.empty) {
        return NextResponse.json({ 
          error: 'You are not invited to this space. Please contact the space owner to add your email to the share list.' 
        }, { status: 403 });
      }

      // Update the email-specific share record with user ID
      const emailShareDoc = emailInviteQuery.docs[0];
      await adminDb.collection('space_shares').doc(emailShareDoc.id).update({
        sharedWithUserId: userId,
        acceptedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
    } else {
      // For direct email invites, update the share record with user ID
      await adminDb.collection('space_shares').doc(shareId).update({
        sharedWithUserId: userId,
        acceptedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
    }

    return NextResponse.json({
      success: true,
      spaceId: spaceId,
      permission: shareData.permission,
      redirectUrl: `/prompts?space=${spaceId}`
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