// lib/cors.js
function applyCors(req, res, { origin = "*" } = {}) {
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  // If you want to send/receive cookies, also set:
  // res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return true; // stop handler
  }
  return false;
}

module.exports = { applyCors };
