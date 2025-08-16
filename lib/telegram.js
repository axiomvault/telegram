import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { Api } from "telegram";

const apiId = Number(process.env.API_ID);
const apiHash = process.env.API_HASH;

if (!apiId || !apiHash) {
  console.warn("API_ID or API_HASH missing. Set them in environment variables.");
}

export async function getClient(stringSession = "") {
  const session = new StringSession(stringSession || "");
  const client = new TelegramClient(session, apiId, apiHash, { connectionRetries: 5 });
  await client.connect();
  return client;
}

export async function sendCode(client, phoneNumber) {
  const result = await client.invoke(
    new Api.auth.SendCode({
      phoneNumber,
      apiId: Number(process.env.API_ID),
      apiHash: process.env.API_HASH,
      settings: new Api.CodeSettings({}),
    })
  );
  return result; // { phoneCodeHash, ... }
}

export async function signIn(client, phoneNumber, phoneCodeHash, phoneCode) {
  const result = await client.invoke(
    new Api.auth.SignIn({
      phoneNumber,
      phoneCodeHash,
      phoneCode,
    })
  );
  return result;
}

export async function needsPassword(err) {
  return (
    (err && err.message && err.message.includes("SESSION_PASSWORD_NEEDED")) ||
    (err && err.errorMessage && err.errorMessage.includes("SESSION_PASSWORD_NEEDED"))
  );
}

export async function check2FA(client, password) {
  const pwd = await client.invoke(new Api.account.GetPassword({}));
  return client.checkPassword(pwd, password);
}

export async function exportSession(client) {
  return client.session.save();
}

export async function getDialogs(client) {
  const dialogs = await client.getDialogs({});
  const groups = dialogs
    .filter(d => (d.isGroup || d.isChannel))
    .map(d => ({
      id: d.id,
      title: d.title,
      isChannel: d.isChannel,
      isGroup: d.isGroup,
      username: d.entity && d.entity.username ? d.entity.username : null
    }));
  return groups;
}

export async function getParticipants(client, usernameOrId, limit = 200) {
  const entity = await client.getEntity(usernameOrId);
  const participants = await client.getParticipants(entity, { limit });
  return participants.map(p => ({
    id: p.id,
    username: p.username,
    firstName: p.firstName,
    lastName: p.lastName
  }));
}

export async function inviteToChannel(client, target, users) {
  const entity = await client.getEntity(target);
  const res = await client.invoke(
    new Api.channels.InviteToChannel({
      channel: entity,
      users: users
    })
  );
  return res;
}

export async function exportInviteLink(client, target) {
  const entity = await client.getEntity(target);
  const res = await client.invoke(new Api.channels.ExportInvite({ channel: entity }));
  return res.link;
}
