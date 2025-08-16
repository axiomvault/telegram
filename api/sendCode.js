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
    const { getClient, sendCodeRaw } = require("../lib/telegram");

    // assign request ID
    req._rid = reqId();
    debug.rid = req._rid;

    // handle CORS
    if (applyCors(req, res, { origin: "*" })) return;

    // allow only POST
    if (req.method !== "POST") {
      debug.stage = "method-check";
      return res.status(405).json({ ok: false, error: "Method not allowed", debug });
    }

    // --- body parsing ---
    let body = req.body;
    if (!body || typeof body !== "object") {
      try {
        let raw = "";
        for await (const chunk of req) raw += chunk;
        body = raw ? JSON.parse(raw) : {};
      } catch (e) {
        debug.stage = "json-parse";
        debug.error = "Invalid JSON body";
        debug.stack = e.stack;
        return res.status(400).json({ ok: false, debug });
      }
    }

    // validate phone
    const { phone } = body || {};
    if (!phone) {
      debug.stage = "param-check";
      return res.status(400).json({ ok: false, error: "Phone number is required", debug });
    }

    // connect DB
    debug.stage = "db-connecting";
    const db = await getDb();
    debug.mongo = { ok: true, dbName: db.databaseName };

    // lookup session (if any)
    debug.stage = "session-lookup";
    const sessionsCol = db.collection("sessions");
    const existing = await sessionsCol.findOne({ phone });
    const sessionString = existing?.string || "";

    // telegram client
    debug.stage = "telegram-client";
    const client = await getClient(sessionString);
    debug.telegram = { clientCreated: true };

    // send code
    debug.stage = "sending-code";
    const result = await sendCodeRaw(client, phone);
    debug.telegram.codeSent = true;

    // store phoneCodeHash
    debug.stage = "store-codehash";
    const codesCol = db.collection("login_codes");
    await codesCol.updateOne(
      { phone },
      { $set: { phone, phoneCodeHash: result.phoneCodeHash, createdAt: new Date() } },
      { upsert: true }
    );

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
