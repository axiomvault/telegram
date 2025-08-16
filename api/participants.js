// backend-vercel/api/participants.js
import { applyCors } from "../lib/cors.js";
import { getDb } from "../lib/db.js";
import { getClient } from "../lib/telegram.js";

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { phone, groupId } = req.query;
    if (!phone || !groupId) {
      return res.status(400).json({ error: "Phone and groupId are required" });
    }

    const db = await getDb();
    const client = await getClient(phone, db);
    const participants = await client.getParticipants(groupId);

    const users = participants.map(u => ({
      id: u.id.toString(),
      username: u.username,
      firstName: u.firstName,
      lastName: u.lastName
    }));

    res.status(200).json(users);
  } catch (err) {
    console.error("Error in /participants:", err);
    res.status(500).json({ error: err.message });
  }
}
