// api/sendCode.js
module.exports = async (req, res) => {
  let debug = {
    rid: "no-rid",
    ts: new Date().toISOString(),
    stage: "init",
  };

  try {
    // keep your libs exactly as-is
    const { applyCors } = require("../lib/cors");
    const { reqId } = require("../lib/util");
    const { getDb } = require("../lib/db");
    const { getClient, sendCodeRaw } = require("../lib/telegram");

    // request id
    req._rid = reqId();
    debug.rid = req._rid;

    // CORS
    if (applyCors(req, res, { origin: "*" })) return;

    // method check
    if (req.method !== "POST") {
      debug.stage = "method-check";
      return res.status(405).json({ ok: false, error: "Method not allowed", debug });
    }

    // parse JSON body (Vercel doesn't auto-parse)
    let raw = "";
    try {
      if (typeof req.body === "string") {
        raw = req.body;
      } else if (Buffer.isBuffer(req.body)) {
        raw = req.body.toString("utf8");
      } else if (!req.body) {
        for await (const chunk of req) raw += chunk;
      }
      const body = raw ? JSON.parse(raw) : (req.body || {});
      req.body = body;
    } catch (e) {
      debug.stage = "json-parse";
      debug.error = "Invalid JSON body";
      debug.stack = e.stack;
      return res.status(400).json({ ok: false, debug });
    }

    // validate
    const { phone } = req.body || {};
    if (!phone) {
      debug.stage = "param-check";
      return res.status(400).json({ ok: false, error: "Phone number is required", debug });
    }

    // DB
    debug.stage = "db-connecting";
    const db = await getDb();
    debug.mongo = { ok: true, dbName: db.databaseName };

    // fetch stored session (optional; first-time will be empty string)
    debug.stage = "session-lookup";
    const sessionsCol = db.collection("sessions");
    const existing = await sessionsCol.findOne({ phone });
    const sessionString = (existing && typeof existing.string === "string") ? existing.string : "";

    // Telegram client
    debug.stage = "telegram-client";
    const client = await getClient(sessionString);
    debug.telegram = { clientCreated: true };

    // Send login code
    debug.stage = "sending-code";
    const result = await sendCodeRaw(client, phone);
    debug.telegram.codeSent = true;

    // persist latest phoneCodeHash so next step can verify
    debug.stage = "store-codehash";
    const codesCol = db.collection("login_codes");
    await codesCol.updateOne(
      { phone },
      {
        $set: {
          phone,
          phoneCodeHash: result.phoneCodeHash,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    // response
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
