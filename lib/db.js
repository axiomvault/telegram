// lib/db.js
const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "telegram_dashboard";

let _client = null;
let _db = null;

async function getDb() {
  if (!uri) throw new Error("MONGODB_URI not set");
  if (_db) return _db;
  _client = new MongoClient(uri);
  await _client.connect();
  _db = _client.db(dbName);
  return _db;
}

// Simple helpers for session/auth_state storage
async function getSessionByPhone(db, phone) {
  return db.collection("sessions").findOne({ phone });
}
async function saveSession(db, phone, session) {
  await db.collection("sessions").updateOne(
    { phone },
    { $set: { phone, session, ts: new Date() } },
    { upsert: true }
  );
}
async function savePhoneCodeHash(db, phone, phoneCodeHash) {
  await db.collection("auth_states").updateOne(
    { phone },
    { $set: { phone, phoneCodeHash, ts: new Date() } },
    { upsert: true }
  );
}
async function getPhoneCodeHash(db, phone) {
  return db.collection("auth_states").findOne({ phone });
}

module.exports = {
  getDb,
  getSessionByPhone,
  saveSession,
  savePhoneCodeHash,
  getPhoneCodeHash
};
