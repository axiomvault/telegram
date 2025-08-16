// api/sendCode.js
module.exports = async (req, res) => {
  let debug = {
    rid: "no-rid",
    ts: new Date().toISOString(),
    stage: "init",
  };

  try {
    const { applyCors } = require("../lib/cors");
    const { reqId } = require("../lib/util");
    const { getDb } = require("../lib/db");
    const { getClient } = require("../lib/telegram");

    // Assign request ID
    req._rid = reqId();
    debug.rid = req._rid;

    // Handle CORS
    if (applyCors(req, res, { origin: "*" })) return;

    // Method check
    if (req.method !== "POST") {
      debug.stage = "method-check";
      return res.status(405).json({ ok: false, error: "Method not allowed", debug });
    }

    // --- Parse JSON body safely ---
    let body = "";
    try {
      for await (const chunk of req) body += chunk;
      req.body = body ? JSON.parse(body) : {};
    } catch (err) {
      debug.stage = "json-parse";
      debug.error = "Invalid JSON body";
      debug.stack = err.stack;
      return res.status(400).json({ ok: false, debug });
    }

    // Validate input
    const { phone } = req.body || {};
    if (!phone) {
      debug.stage = "param-check";
      return res.status(400).json({ ok: false, error: "Phone number is required", debug });
    }

    // --- DB connection ---
    debug.stage = "db-connecting";
    const db = await getDb();
    debug.mongo = { ok: true, dbName: db.databaseName };

    // --- Telegram client ---
    debug.stage = "telegram-client";
    const client = await getClient(phone, db);
    debug.telegram = { clientCreated: true };

    // --- Send Code ---
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
