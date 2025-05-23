import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// 伺服端需要使用「管理員 SDK」（firebase-admin），才能安全地執行任何 CRUD（包括跨集合、跨專案），並且能以 Service Account 的身分來管理。
// 從 env 讀取 Service Account JSON 字串
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!);

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

export const adminDb = getFirestore();