import { getDb } from "../lib/db.js";
import { getClient, inviteToChannel, exportInviteLink } from "../lib/telegram.js";

// Accepts a list of usernames or numeric IDs
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { phone, target, users, mode } = req.body || {};
  if (!phone || !target || !Array.isArray(users)) return res.status(400).json({ error: "phone, target, users[] are required" });

  try {
    const db = await getDb();
    const sess = await db.collection("sessions").findOne({ phone });
    if (!sess) return res.status(401).json({ error: "Not logged in" });
    const client = await getClient(sess.session);

    let results = [];
    if (mode === "link") {
      const link = await exportInviteLink(client, target);
      results.push({ inviteLink: link });
    } else {
      // Batch in small chunks to respect rate limits
      const chunkSize = 5;
      for (let i = 0; i < users.length; i += chunkSize) {
        const chunk = users.slice(i, i + chunkSize);
        try {
          const r = await inviteToChannel(client, target, chunk);
          results.push({ index: i, ok: true });
        } catch (e) {
          results.push({ index: i, ok: false, error: e.message });
        }
      }
    }
    return res.json({ ok: true, results });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
