// app/api/v1/folders/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
// import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const folders = await db
      .collection('folders')
      .find({})
      .toArray();

    // 轉 _id -> id
    const result = folders.map(f => ({
      id: f._id.toString(),
      name: f.name,
      description: f.description || '',
      snippets: f.snippets || []
    }));

    return NextResponse.json(result);
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
    if (!body.name) {
      return NextResponse.json(
        { message: 'name 欄位為必填' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const insertRes = await db
      .collection('folders')
      .insertOne({
        name: body.name,
        description: body.description || '',
        snippets: []
      });

    const created = {
      id: insertRes.insertedId.toString(),
      name: body.name,
      description: body.description || '',
      snippets: []
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
