import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { adminDb } from "@/lib/firebaseAdmin";


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
  const { email, password, name } = await req.json();

  // 1. 基本驗證
  if (!email || !password) {
    return NextResponse.json({ message: "email & password required" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ message: "invalid email format" }, { status: 400 });
  }

  // 2. 檢查是否已存在
  const existing = await adminDb
    .collection("users")
    .where("email", "==", email)
    .limit(1)
    .get();

  if (!existing.empty) {
    return NextResponse.json({ message: "email already in use" }, { status: 409 });
  }

  // 3. 產生密碼 Hash
  const now = new Date();
  const passwordHash = await bcrypt.hash(password, 12);

  // 4. 透過 Firestore Transaction 原子寫入 users + authProviders
  try {
    await adminDb.runTransaction(async tx => {
      // 4.1 建立新 user document
      const userRef = adminDb.collection("users").doc();
      tx.set(userRef, {
        email,
        name: name || "",
        provider: "credentials",
        createdAt: now,
        updatedAt: now,
      });

      // 4.2 建立對應的 authProviders document
      const authRef = adminDb.collection("authProviders").doc();
      tx.set(authRef, {
        userId: userRef.id,
        type: "credentials",
        passwordHash,
        providerAccountId: null,
        accessToken: null,
        refreshToken: null,
        createdAt: now,
        updatedAt: now,
      });
    });

    return NextResponse.json({ message: "Sign up successful" }, { status: 200 });
  } catch (error) {
    console.error("註冊失敗：", error);
    return NextResponse.json(
      { message: "server error", error: (error as Error).message },
      { status: 500 }
    );
  }
}
