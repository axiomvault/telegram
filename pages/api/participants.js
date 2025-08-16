// pages/api/participants.js
import { getDb } from "../../lib/db";
import { getClient } from "../../lib/telegram";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

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
