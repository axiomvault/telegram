// api/groups.js
const { applyCors } = require("../lib/cors");
const { getDb, getSessionByPhone } = require("../lib/db");
const { getClient, getDialogs } = require("../lib/telegram");
const { reqId, log } = require("../lib/util");

module.exports = async (req, res) => {
  req._rid = reqId();
  if (applyCors(req, res, { origin: "*" })) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { phone } = req.body || {};
    if (!phone) return res.status(400).json({ error: "phone required" });

    log(req, "info", "groups.start", { phone });

    const db = await getDb();
    const sess = await getSessionByPhone(db, phone);
    if (!sess) return res.status(401).json({ error: "Not logged in", rid: req._rid });

    const client = await getClient(sess.session);
    const groups = await getDialogs(client);

    log(req, "info", "groups.done", { count: groups.length });
    res.status(200).json({ ok: true, groups, rid: req._rid });
  } catch (err) {
    log(req, "error", "groups.fail", { err: err.message });
    res.status(500).json({ error: err.message, rid: req._rid });
  }
};
