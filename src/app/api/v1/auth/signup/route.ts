import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";                    
// import { sign } from "jsonwebtoken";              
import { connectToDatabase } from "@/lib/mongodb"; 


// interface AuthProvider {
//   _id?: ObjectId;
//   userId: ObjectId;                   // 對應 users._id
//   type: "credentials" | "google";     // 認證類型
//   // ─── credentials 專用 ──────────────────────────────────────
//   passwordHash?: string;              // bcrypt hash（credentials 時必填）
//   // ─── OAuth 共用 ────────────────────────────────────────────
//   providerAccountId?: string;         // OAuth provider 的 sub/id (google: sub, github: id…)
//   accessToken?: string;               // (選填) OAuth 存取 token
//   refreshToken?: string;              // (選填) OAuth refresh token
//   // ─── 通用欄位 ─────────────────────────────────────────────
//   createdAt: Date;
//   updatedAt: Date;
// }

export async function POST(req: Request) {
  // 解析並驗證必要欄位
  const { email, password, name } = await req.json();
  if (!email || !password) {
    return NextResponse.json(
      { message: "email & password required" },
      { status: 400 }
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ message: "invalid email format" }, { status: 400 });
  }

  const { db, client } = await connectToDatabase();
  const session = client.startSession();
  
  try {
    // 檢查是否已存在（請在 Mongo Shell 中：db.users.createIndex({ email: 1 }, { unique: true }) 建立唯一索引）
    const existing = await db.collection("users").findOne({ email });
    if (existing) {
      await session.endSession();
      return NextResponse.json(
        { message: "email already in use" },
        { status: 409 }
      );
    }

    // 建立使用者 + authProviders（交易式寫入）
    const now = new Date();
    const hash = await bcrypt.hash(password, 12);
    
    await session.withTransaction(async () => {
      const userRes = await db
        .collection("users")
        .insertOne(
          { email, name: name || "", createdAt: now, updatedAt: now },
          { session }
        );

      await db
        .collection("authProviders")
        .insertOne(
          {
            userId: userRes.insertedId,
            type: "credentials",
            passwordHash: hash,
            providerAccountId: null,
            accessToken: null,
            refreshToken: null,
            createdAt: now,
            updatedAt: now,
          },
          { session }
        );
    });


    session.endSession();

    return NextResponse.json(
      { message: "Sign up successful" },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("註冊失敗：", err);
    await session.endSession(); 
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { message: "server error", error: message },
      { status: 500 }
    );
  }
}