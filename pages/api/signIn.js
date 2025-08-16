// pages/api/signIn.js
import { getDb } from "../../lib/db";
import { getClient } from "../../lib/telegram";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { phone, code, phoneCodeHash } = req.body;
    if (!phone || !code || !phoneCodeHash) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const db = await getDb();
    const client = await getClient(phone, db);
    await client.signIn({ phone, code, phoneCodeHash });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error in /signIn:", err);
    res.status(500).json({ error: err.message });
  }
}
