import { getDb } from "../lib/db.js";
import { getClient, signIn, exportSession, check2FA, needsPassword } from "../lib/telegram.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { phone, phoneCodeHash, code, password } = req.body || {};
  if (!phone || !phoneCodeHash || !code) return res.status(400).json({ error: "phone, phoneCodeHash, code are required" });

  try {
    const client = await getClient("");
    try {
      await signIn(client, phone, phoneCodeHash, code);
    } catch (err) {
      if (await needsPassword(err)) {
        if (!password) return res.status(401).json({ error: "2FA_PASSWORD_REQUIRED" });
        await check2FA(client, password);
      } else {
        throw err;
      }
    }
    const sessionStr = await exportSession(client);
    const db = await getDb();
    await db.collection("sessions").updateOne(
      { phone },
      { $set: { phone, session: sessionStr, ts: new Date() } },
      { upsert: true }
    );
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
