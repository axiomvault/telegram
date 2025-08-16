# Telegram Dashboard Backend (Vercel)

Serverless API using GramJS (MTProto) + MongoDB Atlas for session storage.

## Endpoints (POST JSON)
- `/api/sendCode` { phone }
- `/api/signIn` { phone, phoneCodeHash, code, password? }
- `/api/groups` { phone }
- `/api/participants` { phone, source, limit? }
- `/api/invite` { phone, target, users:[], mode? "link" }

> Warning: Bulk-invites may hit Telegram rate limits. Prefer invite links when possible.
