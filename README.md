# Telegram Dashboard Backend (Vercel, Node.js, MTProto)

## What this is
Serverless API (no Next.js) that logs in with your **Telegram phone number** and does:
- Send login code
- Sign in (handles 2FA)
- List your groups/chats
- Read participants from a group
- Invite users to a target group/channel (with rate-limit handling) or export invite link

## Endpoints (POST JSON unless specified)
- `POST /api/sendCode` → `{ phone }`
- `POST /api/signIn` → `{ phone, phoneCodeHash, code, password? }`
- `POST /api/groups` → `{ phone }`
- `POST /api/participants` → `{ phone, source, limit? }`
- `POST /api/invite` → `{ phone, target, users:[], mode? "link" }`
- `GET /api/health` → quick ping + CORS check

## Environment Variables (Vercel → Project → Settings)
- `API_ID` (number from my.telegram.org)
- `API_HASH`
- `MONGODB_URI` (Atlas)
- `MONGODB_DB` (e.g. telegram_dashboard)
- `DEBUG=1` (optional, more verbose logs)

## Deploy
1. Put this repo in Vercel.
2. Ensure **no** `pages/` folder exists.
3. Ensure `vercel.json` maps `api/*.js` to `@vercel/node`.
4. Set env vars → Deploy.

## Common Issues
- **404 on OPTIONS**: you deployed under `pages/api` or missing `vercel.json`. Use this layout and vercel.json.
- **CORS blocked**: Routes in `/api/*.js` already set headers. If you want to restrict origin, edit `lib/cors.js`.
- **FLOOD_WAIT**: The invite route parses wait seconds and backs off once. Prefer `mode: "link"` for large moves.

## Security
- This uses your personal Telegram session: **do not** share the backend publicly.
- Consider setting CORS origin to your exact domain in `lib/cors.js`.
