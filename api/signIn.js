const { Api } = require("telegram");

module.exports = async (req, res) => {
  let debug = { ts: new Date().toISOString() };
  try {
    const { applyCors } = require("../lib/cors");
    const { getDb } = require("../lib/db");
    const { getClient } = require("../lib/telegram");

    if (applyCors(req, res, { origin: "*" })) return;

    // parse body
    let rawBody = "";
    for await (const chunk of req) rawBody += chunk;
    let body = rawBody ? JSON.parse(rawBody) : {};
    const { phone, phoneCodeHash, code, password, session } = body;

    if (!phone || !phoneCodeHash || !code) {
      return res.status(400).json({ ok: false, error: "Missing parameters", debug });
    }

    // DB
    const db = await getDb();
    const sessionsCol = db.collection("sessions");

    // client
    const client = await getClient(session || "");
    await client.connect();
    debug.telegram = { clientCreated: true };

    let result;
    try {
      // ✅ OTP Sign-in
      result = await client.invoke(
        new Api.auth.SignIn({
          phoneNumber: phone,
          phoneCodeHash,
          phoneCode: code,
        })
      );
    } catch (err) {
      if (err.errorMessage === "SESSION_PASSWORD_NEEDED") {
        if (!password) throw new Error("2FA_PASSWORD_REQUIRED");

        // ✅ 2FA sign-in
        const { computeCheck } = require("telegram/Password");
        const algo = await client.invoke(new Api.account.GetPassword());
        const passwordHash = await computeCheck(algo, password);

        result = await client.invoke(
          new Api.auth.CheckPassword({ password: passwordHash })
        );
      } else {
        throw err;
      }
    }

    // save session
    const newSession = client.session.save();
    await sessionsCol.updateOne(
      { phone },
      { $set: { phone, string: newSession, updatedAt: new Date() } },
      { upsert: true }
    );

    return res.status(200).json({
      ok: true,
      user: result.user || result,
      session: newSession,
      debug,
    });
  } catch (err) {
    debug.error = err.message;
    debug.stack = err.stack;
    return res.status(500).json({ ok: false, error: err.message, debug });
  }
};
