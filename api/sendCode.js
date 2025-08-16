// backend-vercel/api/sendCode.js
import { getDb } from "../lib/db.js";
import { getClient } from "../lib/telegram.js";

export default async function handler(req, res) {
  // ✅ Always set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "Phone number is required" });

    const db = await getDb();
    const client = await getClient(phone, db);
    const result = await client.sendCode(phone);

    res.status(200).json({ success: true, phoneCodeHash: result.phoneCodeHash });
  } catch (err) {
    console.error("Error in /sendCode:", err);
    res.status(500).json({ error: err.message });
  }
}
