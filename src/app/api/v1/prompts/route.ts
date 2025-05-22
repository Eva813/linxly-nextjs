import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(req: Request) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get('folderId');

    if (!folderId) {
      return NextResponse.json(
        { message: 'folderId required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    
    // 檢查資料夾是否存在
    const folder = await db.collection('folders').findOne({ 
      _id: new ObjectId(folderId),
      userId: new ObjectId(userId) 
    });
    
    if (!folder) {
      return NextResponse.json(
        { message: 'folder not found' },
        { status: 404 }
      );
    }
    
    // 獲取此資料夾的所有 prompt
    const prompts = await db
      .collection('prompts')
      .find({
        folderId: folderId,
        userId: new ObjectId(userId)
      })
      .project({ _id: 1, name: 1, content: 1, shortcut: 1 })
      .toArray();

    const result = prompts.map(s => ({
      id: s._id.toString(),
      name: s.name,
      content: s.content,
      shortcut: s.shortcut
    }));

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'unknow error';
    return NextResponse.json(
      { message: 'server error', error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { folderId, name, content, shortcut } = await req.json();

    if (!folderId || !name || !shortcut) {
      return NextResponse.json(
        { message: 'folderId, name and shortcut required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    
    // 檢查資料夾是否存在
    const folder = await db.collection('folders').findOne({ 
      _id: new ObjectId(folderId),
      userId: new ObjectId(userId) 
    });
    
    if (!folder) {
      return NextResponse.json(
        { message: 'folder not found' },
        { status: 404 }
      );
    }

    // 新增 prompt 片段到 prompts 集合
    const now = new Date();
    const insertRes = await db.collection('prompts').insertOne({
      folderId,
      userId: new ObjectId(userId),
      name,
      content: content || '',
      shortcut,
      createdAt: now,
      updatedAt: now
    });

    const created = {
      id: insertRes.insertedId.toString(),
      folderId,
      name,
      content: content || '',
      shortcut
    };

    return NextResponse.json(created, { status: 201 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'unknow error';
    return NextResponse.json(
      { message: 'server error', error: errorMessage },
      { status: 500 }
    );
  }
}