// api/health.js
module.exports = async (req, res) => {
  try {
    // Basic CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    // Unique request ID for debugging
    const rid = Math.random().toString(36).substring(2, 10);

    res.status(200).json({
      ok: true,
      ts: new Date().toISOString(),
      rid,
    });
  } catch (err) {
    console.error("Health API error:", err);
    res.status(500).json({ error: err.message });
  }
};
