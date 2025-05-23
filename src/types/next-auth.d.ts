// types/next-auth.d.ts
import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  /**
   * 前端拿到的 session.user
   */
  interface Session {
    user: {
      /** Firestore doc ID */
      id: string;
      email: string;
      name?: string;
      image?: string;
    } & DefaultSession["user"];
  }

  /**
   * authorize() & signIn callback 回傳的 user
   */
  interface User extends DefaultUser {
    id: string;
    email: string;
    name?: string;
    image?: string;
  }
}

declare module "next-auth/jwt" {
  /**
   * 存在 JWT 中的欄位
   */
  interface JWT {
    /** Firestore doc ID */
    sub: string;
    email: string;
    name?: string;
    picture?: string;
  }
}
