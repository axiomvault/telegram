// api/invite.js
const { applyCors } = require("../lib/cors");
const { getDb, getSessionByPhone } = require("../lib/db");
const { getClient, inviteToChannel, exportInviteLink } = require("../lib/telegram");
const { reqId, log, sleep, parseFloodWait } = require("../lib/util");

module.exports = async (req, res) => {
  req._rid = reqId();
  if (applyCors(req, res, { origin: "*" })) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { phone, target, users = [], mode } = req.body || {};
    if (!phone || !target) {
      return res.status(400).json({ error: "phone, target required" });
    }

    const db = await getDb();
    const sess = await getSessionByPhone(db, phone);
    if (!sess) return res.status(401).json({ error: "Not logged in", rid: req._rid });

    const client = await getClient(sess.session);

    if (mode === "link") {
      const link = await exportInviteLink(client, target);
      log(req, "info", "invite.link", { target });
      return res.status(200).json({ ok: true, inviteLink: link, rid: req._rid });
    }

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ error: "users[] required when mode != link" });
    }

    log(req, "info", "invite.batch.start", { count: users.length });

    const chunkSize = 5;
    const results = [];

    for (let i = 0; i < users.length; i += chunkSize) {
      const chunk = users.slice(i, i + chunkSize);
      try {
        await inviteToChannel(client, target, chunk);
        results.push({ i, ok: true, added: chunk.length });
      } catch (e) {
        // Handle FLOOD_WAIT grace
        const wait = parseFloodWait(e?.message || e?.errorMessage || "");
        if (wait) {
          results.push({ i, ok: false, error: `FLOOD_WAIT_${wait}` });
          // Backoff once
          await sleep((wait + 1) * 1000);
        } else {
          results.push({ i, ok: false, error: e.message });
        }
      }
      // small delay between chunks
      await sleep(1500);
    }

    log(req, "info", "invite.batch.done", { chunks: results.length });
    res.status(200).json({ ok: true, results, rid: req._rid });
  } catch (err) {
    log(req, "error", "invite.fail", { err: err.message });
    res.status(500).json({ error: err.message, rid: req._rid });
  }
};
