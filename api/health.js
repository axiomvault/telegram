// api/health.js
const { applyCors } = (() => {
  try {
    return require("../lib/cors");
  } catch (err) {
    return { applyCors: () => false, _error: "cors.js missing or broken" };
  }
})();
const { reqId } = (() => {
  try {
    return require("../lib/util");
  } catch (err) {
    return { reqId: () => "no-rid", _error: "util.js missing or broken" };
  }
})();
let getDb;
try {
  ({ getDb } = require("../lib/db"));
} catch (err) {
  getDb = async () => {
    throw new Error("lib/db.js missing or broken: " + err.message);
  };
}

module.exports = async (req, res) => {
  const rid = (reqId && reqId()) || "unknown";

  try {
    if (applyCors && applyCors.applyCors && applyCors.applyCors(req, res, { origin: "*" })) return;

    // Collect debug info
    const debug = {
      rid,
      ts: new Date().toISOString(),
      envVars: {
        MONGODB_URI: !!process.env.MONGODB_URI,
        MONGODB_DB: !!process.env.MONGODB_DB,
        TELEGRAM_API_ID: !!process.env.TELEGRAM_API_ID,
        TELEGRAM_API_HASH: !!process.env.TELEGRAM_API_HASH,
      },
      imports: {
        corsError: applyCors._error || null,
        utilError: reqId._error || null,
      },
      system: {
        nodeVersion: process.version,
        vercelEnv: process.env.VERCEL_ENV || "local",
      },
    };

    // Try Mongo
    try {
      const db = await getDb();
      await db.command({ ping: 1 });
      debug.mongo = { ok: true, dbName: db.databaseName };
    } catch (err) {
      debug.mongo = { ok: false, error: err.message, stack: err.stack };
    }

    res.status(200).json({ ok: true, debug });
  } catch (err) {
    // Catch absolutely everything
    res.status(500).json({
      ok: false,
      rid,
      error: err.message,
      stack: err.stack,
    });
  }
};
