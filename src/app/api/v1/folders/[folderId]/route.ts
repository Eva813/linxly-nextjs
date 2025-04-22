import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(req: Request, { params }: { params: { folderId: string } }) {
  try {
    const { db } = await connectToDatabase();
    const folder = await db.collection('folders').findOne({ _id: new ObjectId(params.folderId) });

    if (!folder) {
      return NextResponse.json({ message: 'Not Found Folder', error: 'Not Found' }, { status: 404 });
    }

    const result = {
      id: folder._id.toString(),
      name: folder.name,
      description: folder.description || '',
      snippets: folder.snippets || [],
    };

    return NextResponse.json(result);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: 'Server error', error: errorMessage }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { folderId: string } }) {
  try {
    const body = await req.json();
    const { name, description } = body;

    if (!name && !description) {
      return NextResponse.json({ message: 'At least provide name or description field' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const updateRes = await db.collection('folders').updateOne(
      { _id: new ObjectId(params.folderId) },
      { $set: { ...(name && { name }), ...(description && { description }) } }
    );

    if (updateRes.matchedCount === 0) {
      return NextResponse.json({ message: 'Not Found Folder', error: 'Not Found' }, { status: 404 });
    }

    const updatedFolder = await db.collection('folders').findOne({ _id: new ObjectId(params.folderId) });

    const result = {
      id: updatedFolder?._id.toString(),
      name: updatedFolder?.name,
      description: updatedFolder?.description || '',
      snippets: updatedFolder?.snippets || [],
    };

    return NextResponse.json(result);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: 'Server error', error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { folderId: string } }) {
  try {
    // 驗證 folderId 格式是否正確
    if (!ObjectId.isValid(params.folderId)) {
      return NextResponse.json(
        { message: 'Invalid folder ID format', error: 'Invalid ID' }, 
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const deleteRes = await db.collection('folders').deleteOne({ 
      _id: new ObjectId(params.folderId) 
    });

    if (deleteRes.deletedCount === 0) {
      return NextResponse.json({ message: 'Not Found Folder', error: 'Not Found' }, { status: 404 });
    }

    // 正確回傳 204 No Content 回應
    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: 'Server error', error: errorMessage }, { status: 500 });
  }
}