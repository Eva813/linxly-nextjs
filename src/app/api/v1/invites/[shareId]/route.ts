import { NextResponse } from 'next/server';
import { adminDb } from '@/server/db/firebase';

// GET /api/v1/invites/{shareId}
// 處理邀請連結訪問
export async function GET(
  req: Request,
  { params }: { params: { shareId: string } }
) {
  try {
    const { shareId } = params;
    if (!shareId) {
      return NextResponse.json({ 
        isValid: false,
        error: 'Share ID is required' 
      }, { status: 400 });
    }

    // Query share record
    const shareDoc = await adminDb.collection('space_shares').doc(shareId).get();

    if (!shareDoc.exists) {
      return NextResponse.json({ 
        isValid: false,
        error: 'Invite not found' 
      }, { status: 404 });
    }

    const shareData = shareDoc.data();
    if (!shareData) {
      return NextResponse.json({ 
        isValid: false,
        error: 'Invalid share data' 
      }, { status: 400 });
    }

    // Check if invite is active
    if (shareData.status !== 'active') {
      return NextResponse.json({
        isValid: false,
        error: 'Invite has been revoked'
      }, { status: 410 });
    }

    // Check expiry - simplified logic
    if (shareData.expiresAt) {
      const expiryDate = shareData.expiresAt.toDate ? shareData.expiresAt.toDate() : new Date(shareData.expiresAt);
      if (new Date() > expiryDate) {
        return NextResponse.json({
          isValid: false,
          error: 'Invite has expired'
        }, { status: 410 });
      }
    }

    // Get space information
    if (!shareData.spaceId) {
      return NextResponse.json({
        isValid: false,
        error: 'Invalid space ID'
      }, { status: 400 });
    }

    const spaceDoc = await adminDb.collection('prompt_spaces').doc(shareData.spaceId).get();
    if (!spaceDoc.exists) {
      return NextResponse.json({
        isValid: false,
        error: 'Associated space not found'
      }, { status: 404 });
    }
    const spaceData = spaceDoc.data();

    // Get owner information - simplified
    let ownerName = 'Unknown User';
    const ownerId = shareData.createdBy || shareData.ownerUserId || spaceData?.userId;
    if (ownerId) {
      const ownerDoc = await adminDb.collection('users').doc(ownerId).get();
      if (ownerDoc.exists) {
        ownerName = ownerDoc.data()?.name || 'Unknown User';
      }
    }

    // Return valid invite info
    return NextResponse.json({
      spaceId: shareData.spaceId,
      spaceName: spaceData?.name || 'Unknown Space',
      ownerName,
      permission: shareData.permission || 'view',
      needsRegistration: true,
      isValid: true,
      isUniversal: shareData.isUniversal || false,
      expiresAt: shareData.expiresAt ? shareData.expiresAt.toDate().toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: shareData.createdAt ? shareData.createdAt.toDate().toISOString() : new Date().toISOString()
    });

  } catch (error: unknown) {
    console.error("GET invite 錯誤:", error);
    return NextResponse.json(
      { 
        isValid: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

