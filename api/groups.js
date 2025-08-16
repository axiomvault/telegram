// backend-vercel/api/groups.js
import { applyCors } from "../lib/cors.js";
import { getDb } from "../lib/db.js";
import { getClient } from "../lib/telegram.js";

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { phone } = req.query;
    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    const db = await getDb();
    const client = await getClient(phone, db);
    const chats = await client.getDialogs();

    // Only return groups
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
