import { NextResponse } from 'next/server';
import { adminDb } from '@/server/db/firebase';
import { getBaseUrl } from '@/server/utils/urlUtils';

// GET /api/v1/prompt-spaces/{spaceId}/invite-links
// Fetch existing invite links for a space
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

    // Check if the space exists and belongs to the user
    const spaceDoc = await adminDb.collection('prompt_spaces').doc(spaceId).get();
    if (!spaceDoc.exists) {
      return NextResponse.json({ message: 'Space not found' }, { status: 404 });
    }

    const spaceData = spaceDoc.data();
    if (spaceData?.userId !== userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    // Query for existing universal invite links
    const existingLinksQuery = await adminDb
      .collection('space_shares')
      .where('promptSpaceId', '==', spaceId)
      .where('isUniversal', '==', true)
      .get();

    const inviteLinks: {
      view?: { link: string; shareId: string; expiresAt: string };
      edit?: { link: string; shareId: string; expiresAt: string };
    } = {};

    // 使用工具函式動態取得 URL
    const baseUrl = getBaseUrl(req);

    // Process existing links
    existingLinksQuery.docs.forEach(doc => {
      const data = doc.data();
      const shareId = doc.id;
      const permission = data.permission;
      
      // Check if link is still valid (not expired)
      if (data.expiresAt) {
        const expiryDate = data.expiresAt.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
        if (new Date() > expiryDate) {
          // Link is expired, skip it
          return;
        }
      }

      if (permission === 'view' || permission === 'edit') {
        inviteLinks[permission as 'view' | 'edit'] = {
          link: `${baseUrl}/invite/${shareId}`,
          shareId,
          expiresAt: data.expiresAt ? 
            (data.expiresAt.toDate ? data.expiresAt.toDate().toISOString() : data.expiresAt) :
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };
      }
    });

    return NextResponse.json({
      inviteLinks,
      success: true
    });

  } catch (error) {
    console.error('Error fetching invite links:', error);
    return NextResponse.json(
      { message: 'Failed to fetch invite links' },
      { status: 500 }
    );
  }
}