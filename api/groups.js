import { getDb } from "../lib/db.js";
import { getClient, getDialogs } from "../lib/telegram.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { phone } = req.body || {};
  if (!phone) return res.status(400).json({ error: "phone is required" });

  try {
    const db = await getDb();
    const sess = await db.collection("sessions").findOne({ phone });
    if (!sess) return res.status(401).json({ error: "Not logged in" });
    const client = await getClient(sess.session);
    const groups = await getDialogs(client);
    return res.json({ ok: true, groups });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
