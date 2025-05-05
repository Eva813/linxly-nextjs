import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sign } from "jsonwebtoken";
import { connectToDatabase } from "@/lib/mongodb";


export async function POST(req: Request) {
  // 1) 解析並驗證必要欄位
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json(
      { message: "email & password required" },
      { status: 400 }
    );
  }
  // 2) 驗證 email 格式
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { message: "invalid email format" },
      { status: 400 }
    );
  }

  try {
    const { db } = await connectToDatabase();
    // 4) 查找使用者
    const user = await db.collection("users").findOne({ email });
    if (!user) {
      return NextResponse.json(
        { message: "user not found" },
        { status: 404 }
      );
    }
    // 5) 取得 credentials provider
    const authProvider = await db
      .collection("authProviders")
      .findOne({ userId: user._id, type: "credentials" });
    if (!authProvider || !authProvider.passwordHash) {
      return NextResponse.json(
        { message: "invalid credentials" },
        { status: 401 }
      );
    }
    // 6) 比對密碼
    const valid = await bcrypt.compare(password, authProvider.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { message: "invalid credentials" },
        { status: 401 }
      );
    }
    // 7) 簽發 JWT
    const jwtToken = sign(
      { sub: user._id.toString(), email: user.email },
      process.env.NEXTAUTH_SECRET as string,
      { expiresIn: "7d" }
    );
    return NextResponse.json(
      { id: user._id.toString(), email: user.email, token: jwtToken },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("登入失敗：", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { message: "server error", error: message },
      { status: 500 }
    );
  }
}