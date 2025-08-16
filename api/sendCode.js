import { getDb } from "../lib/db.js";
import { getClient, sendCode } from "../lib/telegram.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { phone } = req.body || {};
  if (!phone) return res.status(400).json({ error: "phone is required" });

  try {
    const client = await getClient("");
    const result = await sendCode(client, phone);
    const db = await getDb();
    await db.collection("auth_states").updateOne(
      { phone },
      { $set: { phone, phoneCodeHash: result.phoneCodeHash, ts: new Date() } },
      { upsert: true }
    );
    return res.json({ ok: true, phoneCodeHash: result.phoneCodeHash });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
