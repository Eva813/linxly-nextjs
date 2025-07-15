import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/server/db/firebase';

/**
 * POST /api/v1/prompt-spaces/[spaceId]/invite
 * Create a universal invite link for a space (owner only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { spaceId: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { spaceId } = params;
    if (!spaceId) {
      return NextResponse.json({ message: 'Space ID is required' }, { status: 400 });
    }

    const { permission = 'view' } = await request.json();
    
    if (!['view', 'edit'].includes(permission)) {
      return NextResponse.json({ message: 'Invalid permission type' }, { status: 400 });
    }

    // Verify space ownership
    const spaceDoc = await adminDb.collection('prompt_spaces').doc(spaceId).get();
    if (!spaceDoc.exists) {
      return NextResponse.json({ message: 'Space not found' }, { status: 404 });
    }

    const spaceData = spaceDoc.data();
    if (spaceData?.userId !== userId) {
      return NextResponse.json({ message: 'Only space owners can create invite links' }, { status: 403 });
    }

    // Create universal share record
    const shareRef = adminDb.collection('space_shares').doc();
    const shareId = shareRef.id;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const shareData = {
      spaceId,
      permission,
      isUniversal: true, // Mark as universal link
      status: 'active',
      createdAt: now,
      updatedAt: now,
      expiresAt,
      createdBy: userId
    };

    // Check if universal link already exists for this permission
    // 簡化查詢以避免索引問題
    const existingQuery = await adminDb
      .collection('space_shares')
      .where('spaceId', '==', spaceId)
      .where('isUniversal', '==', true)
      .get();

    // 在結果中找到匹配的權限和狀態
    const existingDoc = existingQuery.docs.find(doc => {
      const data = doc.data();
      return data.permission === permission && data.status === 'active';
    });

    if (existingDoc) {
      // Return existing universal link
      const existingData = existingDoc.data();
      
      return NextResponse.json({
        inviteLink: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/invite/${existingDoc.id}`,
        shareId: existingDoc.id,
        permission: existingData.permission,
        expiresAt: existingData.expiresAt.toISOString()
      });
    }

    // Create new universal share record
    await shareRef.set(shareData);

    const inviteLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/invite/${shareId}`;

    return NextResponse.json({
      inviteLink,
      shareId,
      permission,
      expiresAt: expiresAt.toISOString()
    });

  } catch (error) {
    console.error('Create invite link error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { message: 'Internal server error', error: errorMessage },
      { status: 500 }
    );
  }
}