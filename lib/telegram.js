// lib/telegram.js (GramJS/MTProto helpers)
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { Api } = require("telegram");

const apiId = Number(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH;

if (!apiId || !apiHash) {
  console.warn("[telegram] API_ID or API_HASH missing");
}

async function getClient(sessionString = "") {
  // Ensure it's always a valid string
  const safeSession = typeof sessionString === "string" ? sessionString : "";
  const session = new StringSession(safeSession);

  const client = new TelegramClient(session, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.connect();
  return client;
}

// --- Auth ---
async function sendCodeRaw(client, phoneNumber) {
  return client.invoke(
    new Api.auth.SendCode({
      phoneNumber,
      apiId,
      apiHash,
      settings: new Api.CodeSettings({}),
    })
  );
}

async function signInRaw(client, phoneNumber, phoneCodeHash, phoneCode) {
  return client.invoke(
    new Api.auth.SignIn({
      phoneNumber,
      phoneCodeHash,
      phoneCode,
    })
  );
}

async function getPasswordInfo(client) {
  return client.invoke(new Api.account.GetPassword({}));
}

async function checkPassword(client, passwordInfo, password) {
  return client.checkPassword(passwordInfo, password);
}

function exportSession(client) {
  return client.session.save();
}

// --- Data ---
async function getDialogs(client) {
  const dialogs = await client.getDialogs({});
  const groups = dialogs
    .filter((d) => d.isGroup || d.isChannel)
    .map((d) => ({
      id: d.id,
      title: d.title,
      isChannel: !!d.isChannel,
      isGroup: !!d.isGroup,
      username: d?.entity?.username || null,
    }));
  return groups;
}

async function getParticipants(client, usernameOrId, limit = 200) {
  const entity = await client.getEntity(usernameOrId);
  const participants = await client.getParticipants(entity, { limit });
  return participants.map((p) => ({
    id: p.id,
    username: p.username,
    firstName: p.firstName,
    lastName: p.lastName,
  }));
}

async function inviteToChannel(client, target, users) {
  const entity = await client.getEntity(target);
  return client.invoke(
    new Api.channels.InviteToChannel({
      channel: entity,
      users,
    })
  );
}

async function exportInviteLink(client, target) {
  const entity = await client.getEntity(target);
  const r = await client.invoke(new Api.channels.ExportInvite({ channel: entity }));
  return r.link;
}

module.exports = {
  getClient,
  sendCodeRaw,
  signInRaw,
  getPasswordInfo,
  checkPassword,
  exportSession,
  getDialogs,
  getParticipants,
  inviteToChannel,
  exportInviteLink,
};
