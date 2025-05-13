// lib/mongodb.ts
import { MongoClient } from 'mongodb';

declare global {
  // 為 globalThis 增加這個屬性
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient>;
}

const uri = process.env.MONGODB_URI_AUTH;
if (!uri) {
  throw new Error('請設定 MONGODB_URI_AUTH 環境變數');
}

const options = {};  // 依需要可補 { useNewUrlParser: true, useUnifiedTopology: true }

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  if (!globalThis._mongoClientPromise) {
    globalThis._mongoClientPromise = new MongoClient(uri, options).connect();
  }
  clientPromise = globalThis._mongoClientPromise;
} else {
  clientPromise = new MongoClient(uri, options).connect();
}

export async function connectToDatabase() {
  const client = await clientPromise;
  const dbName = process.env.MONGODB_DB_AUTH;
  if (!dbName) {
    throw new Error('請設定 MONGODB_DB_AUTH 環境變數');
  }
  const db = client.db(dbName);
  return { client, db };
}

export default clientPromise;  
