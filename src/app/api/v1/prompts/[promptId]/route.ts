import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  req: Request,
  { params }: { params: { promptId: string } }
) {
  
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const promptId = params.promptId;

  if (!promptId) {
    return NextResponse.json({ message: 'promptId required' }, { status: 400 });
  }
  try {
    const { db } = await connectToDatabase();
    
    // 獲取程式碼片段資訊
    const prompt = await db
      .collection('prompts')
      .findOne(
        {
          _id: new ObjectId(promptId),
          userId: new ObjectId(userId),
        },
        {
          projection: { _id: 1, folderId: 1, name: 1, content: 1, shortcut: 1 }
        }
      );

    if (!prompt) {
      return NextResponse.json(
        { message: 'prompt not found' },
        { status: 404 }
      );
    }
    
    // 格式化回應資料
    const result = {
      id: prompt._id.toString(),
      folderId: prompt.folderId,
      name: prompt.name,
      content: prompt.content,
      shortcut: prompt.shortcut
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
  { params }: { params: { promptId: string } }
) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const promptId = params.promptId;
  const { name, content, shortcut } = await req.json();
  if (!name && content === undefined && !shortcut) {
    return NextResponse.json(
      { message: 'at least one field is required for update' },
      { status: 400 }
    );
  }

  try {
    const { db } = await connectToDatabase();

    // 用 filter 同時帶 _id + userId
    const updateData: { updatedAt: Date; name?: string; content?: string; shortcut?: string } = { updatedAt: new Date() };
    if (name) updateData.name = name;
    if (content !== undefined) updateData.content = content;
    if (shortcut) updateData.shortcut = shortcut;

    const updateResult = await db.collection('prompts').updateOne(
      {
        _id: new ObjectId(promptId),
        userId: new ObjectId(userId)
      },
      { $set: updateData }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ message: 'prompt not found' }, { status: 404 });
    }

    // 回傳更新後的那筆
    const updated = await db
      .collection('prompts')
      .findOne(
        {
          _id: new ObjectId(promptId),
          userId: new ObjectId(userId)
        },
        {
          projection: { _id: 1, folderId: 1, name: 1, content: 1, shortcut: 1 }
        }
      );

    return NextResponse.json({
      id: updated!._id.toString(),
      folderId: updated!.folderId,
      name: updated!.name,
      content: updated!.content,
      shortcut: updated!.shortcut
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { message: 'server error', error: err instanceof Error ? err.message : 'unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { promptId: string } }
) {
  
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const promptId = params.promptId;

  try {
    
    const { db } = await connectToDatabase();
    
    // 直接嘗試刪除，filter 同時帶 _id + userId
    const { deletedCount } = await db.collection('prompts').deleteOne({
      _id: new ObjectId(promptId),
      userId: new ObjectId(userId)
    });

    if (deletedCount === 0) {
      // 刪不到，代表不存在或不屬於這個 user
      return NextResponse.json({ message: 'prompt not found' }, { status: 404 });
    }
    
    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'unknow error';
    return NextResponse.json(
      { message: 'server error', error: errorMessage },
      { status: 500 }
    );
  }
}