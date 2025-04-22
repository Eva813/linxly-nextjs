// lib/mongodb.ts
import { MongoClient } from 'mongodb';

declare global {
  // 為 globalThis 增加這個屬性
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient>;
}

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('請設定 MONGODB_URI 環境變數');
}

const options = {};  // 依需要可補 { useNewUrlParser: true, useUnifiedTopology: true }

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // 開發環境：緩存連線
  if (!globalThis._mongoClientPromise) {
    globalThis._mongoClientPromise = new MongoClient(uri, options).connect();
  }
  clientPromise = globalThis._mongoClientPromise;
} else {
  // 生產環境：每次啟動時各自連一次
  clientPromise = new MongoClient(uri, options).connect();
}

export async function connectToDatabase() {
  const client = await clientPromise;
  const dbName = process.env.MONGODB_DB;
  if (!dbName) {
    throw new Error('請設定 MONGODB_DB 環境變數');
  }
  const db = client.db(dbName);
  return { client, db };
}
