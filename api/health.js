// api/health.js
const { applyCors } = require("../lib/cors");
const { reqId } = require("../lib/util");

module.exports = async (req, res) => {
  req._rid = reqId();
  if (applyCors(req, res, { origin: "*" })) return;
  res.status(200).json({ ok: true, ts: new Date().toISOString(), rid: req._rid });
};
