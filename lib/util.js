// lib/util.js
function reqId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function log(req, level, msg, extra = {}) {
  const id = req._rid || "no-rid";
  const base = { rid: id, level, msg, ...extra };
  if (process.env.DEBUG === "1") {
    console.log(JSON.stringify(base));
  } else {
    // Lean logs in prod
    console.log(`[${level}] ${id} ${msg}`);
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseFloodWait(errMessage = "") {
  // Telegram FLOOD_WAIT_X
  const m = errMessage.match(/FLOOD_WAIT_(\d+)/);
  if (m) return parseInt(m[1], 10);
  return null;
}

module.exports = { reqId, log, sleep, parseFloodWait };
