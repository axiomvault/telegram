import { getDb } from "../lib/db.js";
import { getClient, getParticipants } from "../lib/telegram.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { phone, source, limit } = req.body || {};
  if (!phone || !source) return res.status(400).json({ error: "phone and source are required" });

  try {
    const db = await getDb();
    const sess = await db.collection("sessions").findOne({ phone });
    if (!sess) return res.status(401).json({ error: "Not logged in" });
    const client = await getClient(sess.session);
    const users = await getParticipants(client, source, limit || 200);
    return res.json({ ok: true, users });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
