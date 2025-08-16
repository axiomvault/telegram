// api/sendCode.js
const { applyCors } = require("../lib/cors");
const { reqId } = require("../lib/util");
const { getDb } = require("../lib/db");
const { getClient } = require("../lib/telegram");

module.exports = async (req, res) => {
  req._rid = reqId();

  if (applyCors(req, res, { origin: "*" })) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let debug = {
    rid: req._rid,
    ts: new Date().toISOString(),
    envVars: {
      TELEGRAM_API_ID: !!process.env.TELEGRAM_API_ID,
      TELEGRAM_API_HASH: !!process.env.TELEGRAM_API_HASH,
      MONGODB_URI: !!process.env.MONGODB_URI,
      MONGODB_DB: !!process.env.MONGODB_DB,
    },
    mongo: {},
    telegram: {},
  };

  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: "Phone number is required", debug });
    }

    // 1. Check DB
    const db = await getDb();
    debug.mongo.ok = true;
    debug.mongo.dbName = db.databaseName;

    // 2. Telegram client
    const client = await getClient(phone, db);
    debug.telegram.clientCreated = true;

    // 3. Send login code
    const result = await client.sendCode(phone);
    debug.telegram.codeSent = true;

    return res.status(200).json({
      ok: true,
      phoneCodeHash: result.phoneCodeHash,
      debug,
    });
  } catch (err) {
    console.error("Error in /sendCode:", err);
    debug.error = err.message;
    debug.stack = err.stack;
    return res.status(500).json({ ok: false, debug });
  }
};
