import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  req: Request,
  { params }: { params: { snippetId: string } }
) {
  try {
    const snippetId = params.snippetId;
    
    if (!snippetId) {
      return NextResponse.json(
        { message: 'snippetId 是必需的' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    
    // 獲取程式碼片段資訊
    const snippet = await db.collection('snippets').findOne({
      _id: new ObjectId(snippetId)
    });
    
    if (!snippet) {
      return NextResponse.json(
        { message: '找不到程式碼片段' },
        { status: 404 }
      );
    }
    
    // 格式化回應資料
    const result = {
      id: snippet._id.toString(),
      folderId: snippet.folderId,
      name: snippet.name,
      content: snippet.content,
      shortcut: snippet.shortcut
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
  { params }: { params: { snippetId: string } }
) {
  try {
    const snippetId = params.snippetId;
    const body = await req.json();
    const { name, content, shortcut } = body;
    
    // 至少提供一個欄位進行更新
    if (!name && content === undefined && !shortcut) {
      return NextResponse.json(
        { message: '至少需要提供一個欄位進行更新' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // 檢查程式碼片段是否存在
    const existingSnippet = await db.collection('snippets').findOne({
      _id: new ObjectId(snippetId)
    });
    
    if (!existingSnippet) {
      return NextResponse.json(
        { message: '找不到程式碼片段' },
        { status: 404 }
      );
    }
    
    // 建立更新的物件
    interface SnippetUpdateData {
      updatedAt: Date;
      name?: string;
      content?: string;
      shortcut?: string;
    }
    
    const updateData: SnippetUpdateData = { updatedAt: new Date() };
    if (name) updateData.name = name;
    if (content !== undefined) updateData.content = content;
    if (shortcut) updateData.shortcut = shortcut;
    
    // 更新程式碼片段
    await db.collection('snippets').updateOne(
      { _id: new ObjectId(snippetId) },
      { $set: updateData }
    );
    
    // 獲取更新後的程式碼片段
    const updatedSnippet = await db.collection('snippets').findOne({
      _id: new ObjectId(snippetId)
    });
    
    if (!updatedSnippet) {
      return NextResponse.json(
        { message: '更新後找不到程式碼片段' },
        { status: 404 }
      );
    }
    
    const result = {
      id: updatedSnippet._id.toString(),
      folderId: updatedSnippet.folderId,
      name: updatedSnippet.name,
      content: updatedSnippet.content,
      shortcut: updatedSnippet.shortcut
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
  { params }: { params: { snippetId: string } }
) {
  try {
    const snippetId = params.snippetId;
    
    const { db } = await connectToDatabase();
    
    // 檢查程式碼片段是否存在
    const snippet = await db.collection('snippets').findOne({
      _id: new ObjectId(snippetId)
    });
    
    if (!snippet) {
      return NextResponse.json(
        { message: '找不到程式碼片段' },
        { status: 404 }
      );
    }
    
    // 刪除程式碼片段
    await db.collection('snippets').deleteOne({ 
      _id: new ObjectId(snippetId) 
    });
    
    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '未知錯誤';
    return NextResponse.json(
      { message: '伺服器錯誤', error: errorMessage },
      { status: 500 }
    );
  }
}