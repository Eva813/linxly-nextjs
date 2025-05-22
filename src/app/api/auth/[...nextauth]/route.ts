export const runtime = 'nodejs';
import NextAuth from "next-auth";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import clientPromise from "@/lib/mongodb";
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import bcrypt from "bcryptjs";
import { sign } from "jsonwebtoken";

const handler = NextAuth({
  debug: true,
  adapter: MongoDBAdapter(clientPromise, { 
    databaseName: process.env.MONGODB_DB_AUTH || 'prompts-auth' 
  }), 
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const { email, password } = credentials || {};
          
          // 基本驗證
          if (!email || !password) {
            throw new Error("電子郵件與密碼必填");
          }
          
          // 電子郵件格式驗證
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new Error("電子郵件格式無效");
          }
          
          // 直接連接資料庫
          const { db } = await connectToDatabase();
          
          // 查找使用者
          const user = await db.collection("users").findOne({ email });
          if (!user) {
            throw new Error("找不到使用者");
          }
          
          // 取得認證提供者
          const authProvider = await db
            .collection("authProviders")
            .findOne({ userId: user._id, type: "credentials" });
          
          if (!authProvider || !authProvider.passwordHash) {
            throw new Error("認證失敗");
          }
          
          // 比對密碼
          const valid = await bcrypt.compare(password, authProvider.passwordHash);
          if (!valid) {
            throw new Error("密碼錯誤");
          }
          
          // 簽發 JWT
          const jwtToken = sign(
            { sub: user._id.toString(), email: user.email },
            process.env.NEXTAUTH_SECRET as string,
            { expiresIn: "7d" }
          );
          
          return { 
            id: user._id.toString(), 
            email: user.email, 
            token: jwtToken 
          };
        } catch (error) {
          console.error("登入失敗:", error);
          throw new Error("電子郵件或密碼錯誤");
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // 處理憑證登入
      if (user && account?.provider === 'credentials') {
        token.id = user.id;
        token.email = user.email;
        token.token = user.token;
      }
      
      // 處理 Google OAuth 登入
      if (account?.provider === 'google' && user) {
        token.id = user.id; // 確保 id 被正確設定
        token.accessToken = account.access_token;
        token.email = token.email || user?.email;
        token.image = user.image;
        
        // 確保 MongoDB 物件 ID 格式正確
        try {
          new ObjectId(user.id); // 驗證是否為有效的 ObjectId
        } catch  {
          console.log("Google 使用者 ID 非有效的 MongoDB ObjectId 格式");
          // 這裡可以嘗試獲取或轉換正確的 ID
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Attach tokens to session.user
      session.user = {
        id: token.id,
        email: token.email,
        token: token.token,
        accessToken: token.accessToken,
        image: typeof token.image === 'string' ? token.image : undefined
      };
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // 當 Google 登入建立新使用者時，可在此處理額外邏輯
      const { db } = await connectToDatabase();
      const now = new Date();
      
      // 檢查該使用者是否已有 authProvider 記錄
      const existing = await db.collection("authProviders").findOne({
        userId: new ObjectId(user.id),
        type: "google"
      });
      
      // 如果沒有，則建立 authProvider 記錄
      if (!existing && user.email) {
        await db.collection("authProviders").insertOne({
          userId: new ObjectId(user.id),
          type: "google",
          providerAccountId: user.id,
          passwordHash: null,
          accessToken: null,
          refreshToken: null,
          createdAt: now,
          updatedAt: now
        });
      }
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
  },
  jwt: {
    maxAge: 60 * 60 * 24 * 7,
  },
});

export { handler as GET, handler as POST };