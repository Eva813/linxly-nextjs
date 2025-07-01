/**
 * Firebase Admin 設定和初始化
 * 後端專用的 Firebase 配置
 */

import { adminDb } from './firebaseAdmin';

export { adminDb };

// Re-export 常用的 Firebase Admin 類型
export type { Transaction } from 'firebase-admin/firestore';
