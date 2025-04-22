import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  req: Request,
  { params }: { params: { folderId: string } }
) {
  try {
    const folderId = params.folderId;
    
    if (!folderId) {
      return NextResponse.json(
        { message: 'folderId 是必需的' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    
    // 獲取資料夾資訊
    const folder = await db.collection('folders').findOne({
      _id: new ObjectId(folderId)
    });
    
    if (!folder) {
      return NextResponse.json(
        { message: '找不到資料夾' },
        { status: 404 }
      );
    }
    
    // 獲取該資料夾的所有程式碼片段
    const snippets = await db
      .collection('snippets')
      .find({ folderId })
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
    const errorMessage = error instanceof Error ? error.message : '未知錯誤';
    return NextResponse.json(
      { message: '伺服器錯誤', error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { folderId: string } }
) {
  try {
    const folderId = params.folderId;
    const body = await req.json();
    
    if (!body.name) {
      return NextResponse.json(
        { message: 'name 欄位為必填' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // 更新資料夾資訊
    const updateResult = await db.collection('folders').updateOne(
      { _id: new ObjectId(folderId) },
      { 
        $set: {
          name: body.name,
          description: body.description || '',
          updatedAt: new Date()
        } 
      }
    );
    
    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { message: '找不到資料夾' },
        { status: 404 }
      );
    }
    
    // 獲取更新後的資料夾及其程式碼片段
    const updatedFolder = await db.collection('folders').findOne({
      _id: new ObjectId(folderId)
    });
    
    if (!updatedFolder) {
      return NextResponse.json(
        { message: '找不到資料夾' },
        { status: 404 }
      );
    }
    
    const snippets = await db
      .collection('snippets')
      .find({ folderId })
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
    const errorMessage = error instanceof Error ? error.message : '未知錯誤';
    return NextResponse.json(
      { message: '伺服器錯誤', error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { folderId: string } }
) {
  try {
    const folderId = params.folderId;
    
    const { db } = await connectToDatabase();
    
    // 檢查資料夾是否存在
    const folder = await db.collection('folders').findOne({
      _id: new ObjectId(folderId)
    });
    
    if (!folder) {
      return NextResponse.json(
        { message: '找不到資料夾' },
        { status: 404 }
      );
    }
    
    // 刪除資料夾中的所有程式碼片段
    await db.collection('snippets').deleteMany({ folderId });
    
    // 刪除資料夾
    await db.collection('folders').deleteOne({ _id: new ObjectId(folderId) });
    
    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '未知錯誤';
    return NextResponse.json(
      { message: '伺服器錯誤', error: errorMessage },
      { status: 500 }
    );
  }
}