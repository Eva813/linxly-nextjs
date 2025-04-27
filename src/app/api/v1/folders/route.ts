// app/api/v1/folders/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
// import { ObjectId } from 'mongodb';

// 後端會從資料庫中取得所有資料夾，並且對每個資料夾進行處理，將其關聯的程式碼片段（snippets）一併查詢並格式化後返回
export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const folders = await db
      .collection('folders')
      .find({})
      .toArray();

    // 處理每個資料夾，並獲取其關聯的程式碼片段
    const result = await Promise.all(folders.map(async (folder) => {
      // 從 snippets 集合獲取該資料夾的程式碼片段
      const snippets = await db
        .collection('snippets')
        .find({ folderId: folder._id.toString() })
        .toArray();
      
      // 格式化程式碼片段資料
      const formattedSnippets = snippets.map(s => ({
        id: s._id.toString(),
        name: s.name,
        content: s.content,
        shortcut: s.shortcut
      }));
      
      // 返回完整的資料夾物件，包含 snippets
      return {
        id: folder._id.toString(),
        name: folder.name,
        description: folder.description || '',
        snippets: formattedSnippets
      };
    }));

    return NextResponse.json(result);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'unknow error';
    return NextResponse.json(
      { message: 'server error', error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name) {
      return NextResponse.json(
        { message: 'name required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const insertRes = await db
      .collection('folders')
      .insertOne({
        name: body.name,
        description: body.description || '',
        createdAt: new Date(),
        updatedAt: new Date()
      });

    const created = {
      id: insertRes.insertedId.toString(),
      name: body.name,
      description: body.description || '',
      snippets: [] // 新資料夾初始沒有程式碼片段
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