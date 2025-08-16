import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "telegram_dashboard";

let client;
let db;

export async function getDb() {
  if (!uri) throw new Error("MONGODB_URI not set");
  if (db) return db;
  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);
  return db;
}
