// api/sendCode.js
module.exports = async (req, res) => {
  let debug = {
    rid: "no-rid",
    ts: new Date().toISOString(),
    stage: "init",
  };

  try {
    const { applyCors } = require("../lib/cors");
    const { reqId } = require("../lib/utils");
    const { getDb } = require("../lib/db");
    const { getClient } = require("../lib/telegram");

    req._rid = reqId();
    debug.rid = req._rid;

    if (applyCors(req, res, { origin: "*" })) return;

    if (req.method !== "POST") {
      debug.stage = "method-check";
      return res.status(405).json({ error: "Method not allowed", debug });
    }

    // 🔥 Fix: parse raw body
    let body = {};
    try {
      body = JSON.parse(req.body || "{}");
    } catch (e) {
      debug.stage = "json-parse";
      throw new Error("Invalid JSON body");
    }

    const { phone } = body;
    if (!phone) {
      debug.stage = "param-check";
      return res.status(400).json({ error: "Phone number is required", debug });
    }

    // DB
    debug.stage = "db-connecting";
    const db = await getDb();
    debug.mongo = { ok: true, dbName: db.databaseName };

    // Telegram
    debug.stage = "telegram-client";
    const client = await getClient(phone, db);
    debug.telegram = { clientCreated: true };

    // Send Code
    debug.stage = "sending-code";
    const result = await client.sendCode(phone);
    debug.telegram.codeSent = true;

    return res.status(200).json({
      ok: true,
      phoneCodeHash: result.phoneCodeHash,
      debug,
    });
  } catch (err) {
    console.error("Fatal error in /sendCode:", err);
    debug.stage = debug.stage || "unknown";
    debug.error = err.message;
    debug.stack = err.stack;
    return res.status(500).json({ ok: false, debug });
  }
};
