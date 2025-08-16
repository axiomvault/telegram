// api/health.js
const { applyCors } = require("../lib/cors");
const { reqId } = require("../lib/util");
const { getDb } = require("../lib/db");

module.exports = async (req, res) => {
  try {
    if (applyCors(req, res, { origin: "*" })) return;

    const rid = reqId();

    // --- 1) ENV CHECK ---
    const envCheck = {
      MONGODB_URI: !!process.env.MONGODB_URI,
      TELEGRAM_API_ID: !!process.env.TELEGRAM_API_ID,
      TELEGRAM_API_HASH: !!process.env.TELEGRAM_API_HASH,
    };

    // --- 2) MongoDB CHECK ---
    let mongoCheck = { ok: false };
    try {
      const db = await getDb();
      await db.command({ ping: 1 });
      mongoCheck = { ok: true, dbName: db.databaseName };
    } catch (err) {
      mongoCheck = { ok: false, error: err.message };
    }

    // --- 3) System Info ---
    const systemInfo = {
      nodeVersion: process.version,
      vercelEnv: process.env.VERCEL_ENV || "local",
    };

    // Final response
    res.status(200).json({
      ok: true,
      rid,
      ts: new Date().toISOString(),
      envCheck,
      mongoCheck,
      systemInfo,
    });
  } catch (err) {
    console.error("Health API error:", err);
    res.status(500).json({ error: err.message });
  }
};
