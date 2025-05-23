// /app/api/auth/[...nextauth]/route.ts
export const runtime = 'nodejs';

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { adminDb } from "@/lib/firebaseAdmin";
import bcrypt from "bcryptjs";

const handler = NextAuth({
  debug: true,
  secret: process.env.NEXTAUTH_SECRET,

  // JWT-only，不會把 session 存到 DB
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
  },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials.password) {
            throw new Error("電子郵件與密碼必填");
          }
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
            throw new Error("電子郵件格式無效");
          }

          // 1. 查 Firestore users
          const userSnap = await adminDb
            .collection("users")
            .where("email", "==", credentials.email)
            .limit(1)
            .get();
          if (userSnap.empty) {
            throw new Error("找不到使用者");
          }
          const userDoc = userSnap.docs[0];
          const userData = userDoc.data();

          // 2. 查 authProviders
          const authSnap = await adminDb
            .collection("authProviders")
            .where("userId", "==", userDoc.id)
            .where("type", "==", "credentials")
            .limit(1)
            .get();
          if (authSnap.empty) {
            throw new Error("認證失敗");
          }
          const { passwordHash } = authSnap.docs[0].data() as { passwordHash: string };

          // 3. 比對密碼
          const valid = await bcrypt.compare(credentials.password, passwordHash);
          if (!valid) {
            throw new Error("密碼錯誤");
          }

          // 4. 成功，回傳符合 User 型別
          return {
            id: userDoc.id,
            email: userData.email,
            name: userData.name || null,  // 確保有值
            image: userData.image || null, // 確保有值
          };
        } catch (error) {
          console.error("認證錯誤:", error);
          throw error; // 將錯誤向上拋出給 NextAuth 處理
        }
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),
  ],

  callbacks: {
    // Google 首次登入時 Upsert Firestore users
    async signIn({ user, account, profile }) {
      if ( account?.provider === "google" &&
        profile !== undefined &&
        typeof profile.sub === "string" &&
        user.email) {
        const usersRef = adminDb.collection("users");
        const snap = await usersRef.where("email", "==", user.email).limit(1).get();

        if (snap.empty) {
          // 新增 Google 使用者
          const newDocRef = usersRef.doc();
          await newDocRef.set({
            email: user.email,
            name: user.name,
            image: user.image,
            provider: "google",
            providerAccountId: profile.sub,
            createdAt: new Date(),
          });
          user.id = newDocRef.id;
        } else {
          user.id = snap.docs[0].id;
        }
      }
      return true;
    },

    // 首次簽發 JWT 時把 user.id & email 寫入 token
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },

    // 每次讀 session 時，把 token 裡的欄位放回 session.user
    async session({ session, token }) {
      session.user = {
        id: token.sub as string,
        email: token.email as string,
        name: token.name as string,
        image: token.picture as string,
      };
      return session;
    },
  },
});
export { handler as GET, handler as POST };