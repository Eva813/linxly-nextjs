import { NextResponse } from 'next/server';
import { adminDb } from '@/server/db/firebase';
import { UpdatePromptSpaceRequest } from '@/shared/types/promptSpace';

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

    const body: UpdatePromptSpaceRequest = await req.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ message: 'Space name is required' }, { status: 400 });
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

    // Check if this is the default space and prevent renaming
    if (spaceData?.name === 'promptSpace-default') {
      return NextResponse.json({ 
        message: 'Cannot rename default space' 
      }, { status: 400 });
    }

    // Check for duplicate name
    const existingSpaceQuery = await adminDb
      .collection('prompt_spaces')
      .where('userId', '==', userId)
      .where('name', '==', name.trim())
      .get();

    if (!existingSpaceQuery.empty) {
      // Check if the duplicate is not the current space being updated
      const isDuplicate = existingSpaceQuery.docs.some(doc => doc.id !== spaceId);
      if (isDuplicate) {
        return NextResponse.json({ 
          message: 'A space with this name already exists' 
        }, { status: 400 });
      }
    }

    // Update the space
    await adminDb.collection('prompt_spaces').doc(spaceId).update({
      name: name.trim(),
      updatedAt: new Date()
    });

    // Get updated space data
    const updatedSpaceDoc = await adminDb.collection('prompt_spaces').doc(spaceId).get();
    const updatedSpace = updatedSpaceDoc.data();

    return NextResponse.json({
      id: spaceId,
      name: updatedSpace?.name,
      userId: updatedSpace?.userId,
      createdAt: updatedSpace?.createdAt?.toDate?.()?.toISOString() || updatedSpace?.createdAt,
      updatedAt: updatedSpace?.updatedAt?.toDate?.()?.toISOString() || updatedSpace?.updatedAt
    });

  } catch (error: unknown) {
    console.error("PUT prompt-space 錯誤:", error);
    const errorMessage = error instanceof Error ? error.message : 'unknown error';
    return NextResponse.json(
      { message: 'server error', error: errorMessage },
      { status: 500 }
    );
  }
}

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