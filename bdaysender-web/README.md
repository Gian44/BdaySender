# Birthday Sender Web App

Calendar-based birthday management app with:
- person CRUD (`name`, `email`, `birthdate`)
- editable global message template (`{firstName}`, `{age}`)
- automated daily email sender via Vercel Cron
- send logs page

## Tech Stack
- Next.js (App Router) + React + Tailwind
- Postgres (`DATABASE_URL`)
- Gmail SMTP (`nodemailer`)

## Local Setup

1. Install dependencies:
```bash
npm install
```

2. Start local Postgres backend:
```bash
npm run db:up
```

3. Copy environment template:
```bash
cp .env.example .env.local
```

4. Set required env vars:
- `DATABASE_URL`
- `BDAY_SENDER_GMAIL_ID`
- `BDAY_SENDER_GMAIL_APP_PASSWORD`
- `CRON_SECRET`

5. Run dev server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Notes:
- On first data load with DB connected, the backend auto-seeds the initial people list from existing spreadsheet seed data.
- Stop DB when needed: `npm run db:down`.

## API Overview
- `GET/POST /api/people`
- `PATCH/DELETE /api/people/:id`
- `GET/PATCH /api/template`
- `GET /api/cron/send-birthdays` (requires `CRON_SECRET`)

## Cron Scheduling

`vercel.json` includes:
- `0 22 * * *` for `/api/cron/send-birthdays`

This corresponds to 6:00 AM Asia/Manila (UTC+8).

## Deploy to Vercel

1. Push repository to Git provider.
2. Import project in Vercel.
3. Provision a hosted Postgres database and set `DATABASE_URL`.
4. Set remaining environment variables from `.env.example`.
5. Deploy.
6. Verify cron route protection and logs:
   - App logs page: `/logs`
   - Vercel function logs for `/api/cron/send-birthdays`

## One-command Vercel env sync

You can avoid manually entering vars in the Vercel dashboard every time.

1. Link project once:
```bash
npx vercel link
```

2. Create Vercel env file from template:
```bash
cp .env.vercel.production.example .env.vercel.production
```

3. Fill `.env.vercel.production` with real values.

4. Set your Vercel token:
```bash
export VERCEL_TOKEN=your_vercel_token
```
PowerShell:
```powershell
$env:VERCEL_TOKEN="your_vercel_token"
```

5. Push all vars to Vercel Production:
```bash
npm run vercel:env:push
```

This updates existing env vars and adds missing ones in one command.
