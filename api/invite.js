// backend-vercel/api/invite.js
import { applyCors } from "../lib/cors.js";
import { getDb } from "../lib/db.js";
import { getClient } from "../lib/telegram.js";

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { phone, groupId, userIds } = req.body;
    if (!phone || !groupId || !Array.isArray(userIds)) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const db = await getDb();
    const client = await getClient(phone, db);

    for (const userId of userIds) {
      try {
        await client.addToGroup(groupId, userId);
      } catch (err) {
        console.warn(`Failed to add ${userId}:`, err.message);
      }
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error in /invite:", err);
    res.status(500).json({ error: err.message });
  }
}
