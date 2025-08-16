// backend-vercel/api/sendCode.js
import { applyCors } from "../lib/cors.js";
import { getDb } from "../lib/db.js";
import { getClient } from "../lib/telegram.js";

export default async function handler(req, res) {
  // ✅ Handle CORS first
  if (applyCors(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    // Connect to DB
    const db = await getDb();

    // Get Telegram client
    const client = await getClient(phone, db);

    // Send login code
    const result = await client.sendCode(phone);

    res.status(200).json({ success: true, phoneCodeHash: result.phoneCodeHash });
  } catch (err) {
    console.error("Error in /sendCode:", err);
    res.status(500).json({ error: err.message });
  }
}
