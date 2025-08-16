// api/signIn.js
const { applyCors } = require("../lib/cors");
const { getDb, getPhoneCodeHash, saveSession } = require("../lib/db");
const {
  getClient,
  signInRaw,
  getPasswordInfo,
  checkPassword,
  exportSession
} = require("../lib/telegram");
const { reqId, log } = require("../lib/util");

module.exports = async (req, res) => {
  req._rid = reqId();
  if (applyCors(req, res, { origin: "*" })) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { phone, phoneCodeHash, code, password } = req.body || {};
    if (!phone || !phoneCodeHash || !code) {
      return res.status(400).json({ error: "phone, phoneCodeHash, code required" });
    }

    log(req, "info", "signIn.start", { phone });

    const db = await getDb();
    // you may optionally verify phoneCodeHash against DB:
    const state = await getPhoneCodeHash(db, phone);
    if (!state) log(req, "warn", "signIn.noState", { phone });

    const client = await getClient("");

    try {
      await signInRaw(client, phone, phoneCodeHash, code);
    } catch (err) {
      if (
        (err && err.message && err.message.includes("SESSION_PASSWORD_NEEDED")) ||
        (err && err.errorMessage && err.errorMessage.includes("SESSION_PASSWORD_NEEDED"))
      ) {
        if (!password) {
          return res.status(401).json({ error: "2FA_PASSWORD_REQUIRED", rid: req._rid });
        }
        const pwdInfo = await getPasswordInfo(client);
        await checkPassword(client, pwdInfo, password);
      } else {
        throw err;
      }
    }

    const sessionStr = await exportSession(client);
    await saveSession(db, phone, sessionStr);

    log(req, "info", "signIn.done", { phone });
    res.status(200).json({ ok: true, rid: req._rid });
  } catch (err) {
    log(req, "error", "signIn.fail", { err: err.message });
    res.status(500).json({ error: err.message, rid: req._rid });
  }
};
