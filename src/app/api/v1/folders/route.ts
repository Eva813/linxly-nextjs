// app/api/v1/folders/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// 後端會從資料庫中取得所有資料夾，並且對每個資料夾進行處理，將其關聯的（prompts）一併查詢並格式化後返回
export async function GET(req: Request) {
  
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { db } = await connectToDatabase();
    const folders = await db
      .collection('folders')
      .find({ userId: new ObjectId(userId) })
      .toArray();

    // 處理每個資料夾，並獲取其關聯的程式碼片段
    const result = await Promise.all(folders.map(async (folder) => {
      // 從 prompts 集合獲取該資料夾的 prompts
      const prompts = await db
        .collection('prompts')
        .find({
          folderId: folder._id.toString(),         // 或 ObjectId(folder._id) 視 schema 而定
          userId: new ObjectId(userId),           // 加上 userId 過濾
        })
        .project({                             // 告訴 MongoDB「只回傳這四個欄位」，其他一律排除
          _id: 1,
          name: 1,
          content: 1,
          shortcut: 1
        })
        .toArray();
      
      // 格式化程式碼片段資料
      const formattedPrompts = prompts.map(s => ({
        id: s._id.toString(),
        name: s.name,
        content: s.content,
        shortcut: s.shortcut
      }));
      
      // 返回完整的資料夾物件，包含 prompts
      return {
        id: folder._id.toString(),
        name: folder.name,
        description: folder.description || '',
        prompts: formattedPrompts
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
  const userId = req.headers.get('x-user-id')
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
        userId: userId ? new ObjectId(userId) : null,
        name: body.name,
        description: body.description || '',
        createdAt: new Date(),
        updatedAt: new Date()
      });

    const created = {
      id: insertRes.insertedId.toString(),
      name: body.name,
      description: body.description || '',
      prompts: [] // 新資料夾初始沒有 prompts
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