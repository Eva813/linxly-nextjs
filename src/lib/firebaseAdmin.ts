import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// 伺服端需要使用「管理員 SDK」（firebase-admin），才能安全地執行任何 CRUD（包括跨集合、跨專案），並且能以 Service Account 的身分來管理。
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKeyEnv = process.env.FIREBASE_PRIVATE_KEY;
if (!projectId || !clientEmail || !privateKeyEnv) {
  throw new Error("Missing Firebase admin credentials in environment variables.");
}
const serviceAccount = {
  type: "service_account",
  projectId,
  clientEmail,
  privateKey: privateKeyEnv.replace(/\\n/g, '\n'),
};

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

export const adminDb = getFirestore();