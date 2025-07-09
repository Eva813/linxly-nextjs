import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sign } from "jsonwebtoken";
import { adminDb } from "@/server/db/firebase";

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
    // 3) 查找使用者
    const userSnapshot = await adminDb
      .collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      return NextResponse.json(
        { message: "user not found" },
        { status: 404 }
      );
    }

    const user = userSnapshot.docs[0].data();

    // 4) 取得 credentials provider
    const authProviderSnapshot = await adminDb
      .collection("authProviders")
      .where("userId", "==", user.id)
      .where("type", "==", "credentials")
      .limit(1)
      .get();

    if (authProviderSnapshot.empty) {
      return NextResponse.json(
        { message: "invalid credentials" },
        { status: 401 }
      );
    }

    const authProvider = authProviderSnapshot.docs[0].data();

    // 5) 比對密碼
    const valid = await bcrypt.compare(password, authProvider.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { message: "invalid credentials" },
        { status: 401 }
      );
    }

    // 6) 簽發 JWT
    const jwtToken = sign(
      { sub: user.id, email: user.email },
      process.env.NEXTAUTH_SECRET as string,
      { expiresIn: "7d" }
    );

    console.log("登入參數：", { email, password });
    return NextResponse.json(
      { id: user.id, email: user.email, token: jwtToken },
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