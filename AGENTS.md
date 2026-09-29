<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

- Node.js 22 satisfies the Node 20.9+ requirement in the README. Install with `npm ci`.
- The Cloud Agent environment starts MySQL 8 on `127.0.0.1:3306` (database, user, and password are all `narrativeos`), Mailpit on SMTP `127.0.0.1:1025` (inbox UI `http://127.0.0.1:8025`), and a local workbench auth stub at `http://127.0.0.1:3001/api/forge/auth/config` that returns `{"mode":"sso"}`. That stub is what makes the site header show 登录 / 退出. Registration codes are captured by Mailpit; no external SMTP account is required.
- Startup writes a gitignored `.env` when one is missing (`DATABASE_URL`, a generated `AUTH_SECRET`, local SMTP, and `NEXT_PUBLIC_WORKBENCH_URL=http://127.0.0.1:3001/`) and then runs `npx prisma migrate deploy`.
- The environment start command brings up MySQL, Mailpit, the auth stub, migrations, and `npm run dev -- --hostname localhost --port 3000`. Open `http://localhost:3000`. Next.js 16 rejects dev assets when the browser host differs from the host the dev server was started with. `http://127.0.0.1:3000` does not serve this dev server, and binding `0.0.0.0` while browsing `127.0.0.1` returns 403 for `/_next` chunks, so the page looks loaded but client-side login does not run.
- Checks that apply here: `npm run lint` and `npm run build`. There is no automated test suite. `npx tsc --noEmit` needs the types that `next dev` or `next build` generates.
