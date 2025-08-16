// api/sendCode.js
const { applyCors } = require("../lib/cors");
const { getDb, savePhoneCodeHash } = require("../lib/db");
const { getClient, sendCodeRaw } = require("../lib/telegram");
const { reqId, log } = require("../lib/util");

module.exports = async (req, res) => {
  req._rid = reqId();
  if (applyCors(req, res, { origin: "*" })) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { phone } = req.body || {};
    if (!phone) return res.status(400).json({ error: "phone is required" });

    log(req, "info", "sendCode.start", { phone });

    const client = await getClient("");
    const result = await sendCodeRaw(client, phone);

    const db = await getDb();
    await savePhoneCodeHash(db, phone, result.phoneCodeHash);

    log(req, "info", "sendCode.done", { phone });
    res.status(200).json({ ok: true, phoneCodeHash: result.phoneCodeHash, rid: req._rid });
  } catch (err) {
    log(req, "error", "sendCode.fail", { err: err.message });
    res.status(500).json({ error: err.message, rid: req._rid });
  }
};
