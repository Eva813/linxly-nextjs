import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get('folderId');

    if (!folderId) {
      return NextResponse.json(
        { message: 'folderId 欄位為必填' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    
    // 檢查資料夾是否存在
    const folder = await db.collection('folders').findOne({ 
      _id: new ObjectId(folderId) 
    });
    
    if (!folder) {
      return NextResponse.json(
        { message: '資料夾不存在' },
        { status: 404 }
      );
    }
    
    // 獲取此資料夾的所有程式碼片段
    const snippets = await db
      .collection('snippets')
      .find({ folderId })
      .toArray();

    const result = snippets.map(s => ({
      id: s._id.toString(),
      name: s.name,
      content: s.content,
      shortcut: s.shortcut
    }));

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '未知錯誤';
    return NextResponse.json(
      { message: '伺服器錯誤', error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { folderId, name, content, shortcut } = body;

    if (!folderId || !name || !shortcut) {
      return NextResponse.json(
        { message: 'folderId, name 與 shortcut 欄位為必填' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    
    // 檢查資料夾是否存在
    const folder = await db.collection('folders').findOne({ 
      _id: new ObjectId(folderId) 
    });
    
    if (!folder) {
      return NextResponse.json(
        { message: '資料夾不存在' },
        { status: 404 }
      );
    }

    // 新增程式碼片段到 snippets 集合
    const insertRes = await db.collection('snippets').insertOne({
      folderId,
      name,
      content: content || '',
      shortcut,
      createdAt: new Date(),
      updatedAt: new Date()
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
    const errorMessage = error instanceof Error ? error.message : '未知錯誤';
    return NextResponse.json(
      { message: '伺服器錯誤', error: errorMessage },
      { status: 500 }
    );
  }
}