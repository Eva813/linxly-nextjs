import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  req: Request,
  { params }: { params: { folderId: string } }
) {
  
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const folderId = params.folderId;
  if (!folderId) {
    return NextResponse.json({ message: 'folderId required' }, { status: 400 });
  }
  try {

    const { db } = await connectToDatabase();
    
    // 獲取資料夾資訊
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
    
    // 獲取該資料夾的所有 snippet 片段
    const snippets = await db
      .collection('snippets')
      .find({ folderId, userId: new ObjectId(userId) })
      .project({ _id: 1, name: 1, content: 1, shortcut: 1 })
      .toArray();
    
    // 格式化回應資料
    const result = {
      id: folder._id.toString(),
      name: folder.name,
      description: folder.description || '',
      snippets: snippets.map(s => ({
        id: s._id.toString(),
        name: s.name,
        content: s.content,
        shortcut: s.shortcut
      }))
    };
    
    return NextResponse.json(result);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'unknow error';
    return NextResponse.json(
      { message: 'server error', error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { folderId: string } }
) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const folderId = params.folderId;
  const { name, description } = await req.json();
  if (!name) {
    return NextResponse.json({ message: 'name required' }, { status: 400 });
  }
  try {
    
    const { db } = await connectToDatabase();
    
    // 更新資料夾資訊
    const updateResult = await db.collection('folders').updateOne(
      { _id: new ObjectId(folderId), userId: new ObjectId(userId) },
      { 
        $set: { name, description: description || '', updatedAt: new Date() } 
      }
    );
    
    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { message: 'folder not found' },
        { status: 404 }
      );
    }
    
    // 獲取更新後的資料夾及其程式碼片段
    const updatedFolder = await db.collection('folders').findOne({
      _id: new ObjectId(folderId),
      userId: new ObjectId(userId)
    });
    
    if (!updatedFolder) {
      return NextResponse.json(
        { message: 'folder not found' },
        { status: 404 }
      );
    }
    
    // 獲取該資料夾的所有 snippet 片段
    const snippets = await db
      .collection('snippets')
      .find({ folderId: folderId, userId: new ObjectId(userId) })
      .project({ _id: 1, name: 1, content: 1, shortcut: 1 })
      .toArray();
    
    const result = {
      id: updatedFolder._id.toString(),
      name: updatedFolder.name,
      description: updatedFolder.description || '',
      snippets: snippets.map(s => ({
        id: s._id.toString(),
        name: s.name,
        content: s.content,
        shortcut: s.shortcut
      }))
    };
    
    return NextResponse.json(result);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'unknow error';
    return NextResponse.json(
      { message: 'server error', error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { folderId: string } }
) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const folderId = params.folderId;
  try {
    
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
    
    // 刪除資料夾中的所有程式碼片段
    await db.collection('snippets').deleteMany({
      folderId: folderId,
      userId: new ObjectId(userId)
    });
    
    // 刪除資料夾
    await db.collection('folders').deleteOne({
      _id: new ObjectId(folderId),
      userId: new ObjectId(userId)
    });
    
    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'unknow error';
    return NextResponse.json(
      { message: 'server error', error: errorMessage },
      { status: 500 }
    );
  }
}