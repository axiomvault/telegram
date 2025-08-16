// pages/api/groups.js
import { getDb } from "../../lib/db";
import { getClient } from "../../lib/telegram";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ error: "Phone number is required" });

    const db = await getDb();
    const client = await getClient(phone, db);
    const chats = await client.getDialogs();

    const groups = chats.filter(c => c.isGroup).map(c => ({
      id: c.id.toString(),
      title: c.title
    }));

    res.status(200).json(groups);
  } catch (err) {
    console.error("Error in /groups:", err);
    res.status(500).json({ error: err.message });
  }
}
