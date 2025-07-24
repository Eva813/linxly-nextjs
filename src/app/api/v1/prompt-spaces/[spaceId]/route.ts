import { NextResponse } from 'next/server';
import { adminDb } from '@/server/db/firebase';
import { FieldValue } from 'firebase-admin/firestore';
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

    // Note: Default space can be renamed, but cannot be deleted

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
      defaultSpace: updatedSpace?.defaultSpace || false,
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
    if (spaceData?.defaultSpace === true) {
      return NextResponse.json({ 
        message: 'Cannot delete default space' 
      }, { status: 400 });
    }

    // Start a batch write for atomic deletion
    const batch = adminDb.batch();

    // 1. Delete all prompts in this space
    const promptsQuery = await adminDb
      .collection('prompts')
      .where('promptSpaceId', '==', spaceId)
      .get();
    
    promptsQuery.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // 2. Delete all folders in this space
    const foldersQuery = await adminDb
      .collection('folders')
      .where('promptSpaceId', '==', spaceId)
      .get();
    
    foldersQuery.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // 3. Delete all space shares for this space
    const sharesQuery = await adminDb
      .collection('space_shares')
      .where('promptSpaceId', '==', spaceId)
      .get();
    
    sharesQuery.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // 4. Delete the space itself
    batch.delete(adminDb.collection('prompt_spaces').doc(spaceId));

    // Execute all deletions atomically
    await batch.commit();

    return NextResponse.json({ message: 'Space and all associated data deleted successfully' });

  } catch (error: unknown) {
    console.error("DELETE prompt-space 錯誤:", error);
    const errorMessage = error instanceof Error ? error.message : 'unknown error';
    return NextResponse.json(
      { message: 'server error', error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const { action } = body;

    if (action !== 'setDefault') {
      return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
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

    // 使用批次操作來確保原子性
    const batch = adminDb.batch();

    // 1. 將用戶的所有其他 space 設為非默認
    const userSpacesQuery = await adminDb
      .collection('prompt_spaces')
      .where('userId', '==', userId)
      .get();

    userSpacesQuery.docs.forEach(doc => {
      if (doc.id !== spaceId) {
        batch.update(doc.ref, {
          defaultSpace: false,
          updatedAt: FieldValue.serverTimestamp()
        });
      }
    });

    // 2. 將目標 space 設為默認
    batch.update(adminDb.collection('prompt_spaces').doc(spaceId), {
      defaultSpace: true,
      updatedAt: FieldValue.serverTimestamp()
    });

    // 執行批次操作
    await batch.commit();

    // 返回更新後的 space 資料
    const updatedSpaceDoc = await adminDb.collection('prompt_spaces').doc(spaceId).get();
    const updatedSpace = updatedSpaceDoc.data();

    return NextResponse.json({
      id: spaceId,
      name: updatedSpace?.name,
      userId: updatedSpace?.userId,
      defaultSpace: true,
      createdAt: updatedSpace?.createdAt?.toDate?.()?.toISOString() || updatedSpace?.createdAt,
      updatedAt: updatedSpace?.updatedAt?.toDate?.()?.toISOString() || updatedSpace?.updatedAt
    });

  } catch (error: unknown) {
    console.error("PATCH prompt-space 錯誤:", error);
    const errorMessage = error instanceof Error ? error.message : 'unknown error';
    return NextResponse.json(
      { message: 'server error', error: errorMessage },
      { status: 500 }
    );
  }
}