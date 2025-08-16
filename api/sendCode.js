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
    const { getClient, sendCodeRaw, exportSession } = require("../lib/telegram");

    // request ID
    req._rid = reqId();
    debug.rid = req._rid;

    // CORS
    if (applyCors(req, res, { origin: "*" })) return;

    // method check
    if (req.method !== "POST") {
      debug.stage = "method-check";
      return res.status(405).json({ ok: false, error: "Method not allowed", debug });
    }

    // --- Parse body manually ---
    let rawBody = "";
    for await (const chunk of req) rawBody += chunk;
    let body;
    try {
      body = rawBody ? JSON.parse(rawBody) : {};
    } catch (e) {
      debug.stage = "json-parse";
      debug.error = "Invalid JSON body";
      debug.stack = e.stack;
      return res.status(400).json({ ok: false, debug });
    }

    const { phone } = body;
    if (!phone) {
      debug.stage = "param-check";
      return res.status(400).json({ ok: false, error: "Phone number is required", debug });
    }

    // connect DB
    debug.stage = "db-connecting";
    const db = await getDb();
    debug.mongo = { ok: true, dbName: db.databaseName };

    // lookup existing session
    debug.stage = "session-lookup";
    const sessionsCol = db.collection("sessions");
    const existing = await sessionsCol.findOne({ phone });
    const sessionString = existing?.string || "";

    // Telegram client
    debug.stage = "telegram-client";
    const client = await getClient(sessionString);
    debug.telegram = { clientCreated: true };

    // send login code
    debug.stage = "sending-code";
    const result = await sendCodeRaw(client, phone);
    debug.telegram.codeSent = true;

    // export current session string (so signIn can re-use it)
    const session = exportSession(client);

    // save session + codeHash
    debug.stage = "store-codehash";
    const codesCol = db.collection("login_codes");
    await codesCol.updateOne(
      { phone },
      {
        $set: {
          phone,
          phoneCodeHash: result.phoneCodeHash,
          session,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    return res.status(200).json({
      ok: true,
      phoneCodeHash: result.phoneCodeHash,
      session: client.session.save(),
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
