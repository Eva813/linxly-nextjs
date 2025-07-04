import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// client 端的 firebase.ts 用的是「前端 SDK」（firebase/app、firebase/firestore、firebase/auth），這些只能做讀取或在使用者權限下的寫入。
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// 確保不會重複初始化
const app = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();

// Client SDK 可以按需匯出
export const analytics = typeof window !== "undefined"
  ? getAnalytics(app)
  : null;

export const auth = getAuth(app);
export const db = getFirestore(app);
