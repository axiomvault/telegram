// api/signIn.js
const { applyCors } = require("../lib/cors");
const { reqId } = require("../lib/util");
const { getDb } = require("../lib/db");
const { getClient, signInRaw, exportSession } = require("../lib/telegram");

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
    // --- Parse body manually ---
    let rawBody = "";
    for await (const chunk of req) rawBody += chunk;
    let body;
    try {
      body = rawBody ? JSON.parse(rawBody) : {};
    } catch (e) {
      return res.status(400).json({ ok: false, error: "Invalid JSON", debug });
    }

    const { phone, phoneCodeHash, code, session } = body;
    if (!phone || !phoneCodeHash || !code || !session) {
      return res.status(400).json({ ok: false, error: "Missing parameters", debug });
    }

    // 1. DB check
    const db = await getDb();
    debug.mongo.ok = true;
    debug.mongo.dbName = db.databaseName;

    // 2. Re-use session from /sendCode
    const client = await getClient(session);
    debug.telegram.clientCreated = true;

    // 3. Sign in with code
    const result = await signInRaw(client, phone, phoneCodeHash, code);
    debug.telegram.signIn = true;

    // 4. Export session after login
    const finalSession = exportSession(client);

    // Save session to DB
    const sessionsCol = db.collection("sessions");
    await sessionsCol.updateOne(
      { phone },
      { $set: { phone, string: finalSession, updatedAt: new Date() } },
      { upsert: true }
    );

    return res.status(200).json({
      ok: true,
      user: result.user,
      session: finalSession,
      debug,
    });
  } catch (err) {
    console.error("Error in /signIn:", err);
    debug.error = err.message;
    debug.stack = err.stack;
    return res.status(500).json({ ok: false, debug });
  }
};
