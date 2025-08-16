// api/participants.js
const { applyCors } = require("../lib/cors");
const { getDb, getSessionByPhone } = require("../lib/db");
const { getClient, getParticipants } = require("../lib/telegram");
const { reqId, log } = require("../lib/util");

module.exports = async (req, res) => {
  req._rid = reqId();
  if (applyCors(req, res, { origin: "*" })) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { phone, source, limit } = req.body || {};
    if (!phone || !source) return res.status(400).json({ error: "phone, source required" });

    log(req, "info", "participants.start", { source });

    const db = await getDb();
    const sess = await getSessionByPhone(db, phone);
    if (!sess) return res.status(401).json({ error: "Not logged in", rid: req._rid });

    const client = await getClient(sess.session);
    const users = await getParticipants(client, source, limit || 200);

    log(req, "info", "participants.done", { count: users.length });
    res.status(200).json({ ok: true, users, rid: req._rid });
  } catch (err) {
    log(req, "error", "participants.fail", { err: err.message });
    res.status(500).json({ error: err.message, rid: req._rid });
  }
};
