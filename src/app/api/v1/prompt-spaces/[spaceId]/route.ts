import { NextResponse } from 'next/server';
import { adminDb } from '@/server/db/firebase';

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

    // Check if the space exists and belongs to the user
    const spaceDoc = await adminDb.collection('prompt_spaces').doc(spaceId).get();
    
    if (!spaceDoc.exists) {
      return NextResponse.json({ message: 'Space not found' }, { status: 404 });
    }

    const spaceData = spaceDoc.data();
    if (spaceData?.userId !== userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    // Check if this is the default space
    if (spaceData?.name === 'promptSpace-default') {
      return NextResponse.json({ 
        message: 'Cannot delete default space' 
      }, { status: 400 });
    }

    // Delete the space
    await adminDb.collection('prompt_spaces').doc(spaceId).delete();

    // TODO: Also delete or reassign all folders and prompts associated with this space
    // This would require additional logic to handle data migration

    return NextResponse.json({ message: 'Space deleted successfully' });

  } catch (error: unknown) {
    console.error("DELETE prompt-space 錯誤:", error);
    const errorMessage = error instanceof Error ? error.message : 'unknown error';
    return NextResponse.json(
      { message: 'server error', error: errorMessage },
      { status: 500 }
    );
  }
}