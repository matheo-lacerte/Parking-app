# Parking-app

## Overview

The backend is 100% serverless using Vercel Functions in `api/`. Frontend calls `/api/...` and the functions reuse controllers/middleware from `server/src/**`.

Key endpoints:

- `/api/auth/signup` (POST)
- `/api/auth/login` (POST)
- `/api/auth/logout` (POST)
- `/api/auth/getProfile` (GET, protected)
- `/api/observations/byDate` (GET, protected)
- `/api/health` (GET)

## Environment Variables

Configure these on Vercel and locally:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_ANON_KEY`
- Optional frontend base: `VITE_API_BASE_URL` (defaults to `/api`)

## Run Locally (Serverless)

Use the Vercel CLI to emulate serverless functions and the frontend.

1) Install Vercel CLI:

```bat
npm i -g vercel
```

2) Pull env vars (optional, if configured on Vercel):

```bat
vercel env pull .env.local
```

Or create a local `.env` with the Supabase variables.

3) Start the dev server (functions + frontend):

```bat
vercel dev
```

Open `http://localhost:3000`. Frontend requests to `/api/...` will hit local serverless functions.

## Alternative: Vite + Remote API

If you prefer to run Vite and call a deployed API:

```bat
set VITE_API_BASE_URL=https://<your-app>.vercel.app/api
npm run dev
```

Then browse `http://localhost:5173`.

## Deployment

Push to `main` and deploy with Vercel. The file `vercel.json` ensures all `api/**/*` functions include `server/**` code they rely on.

## Files of interest

- `src/lib/api.js`: API helper (`BASE = /api` by default)
- `api/auth/*`, `api/observations/*`, `api/health/*`: serverless function handlers
- `server/src/controllers/*`, `server/src/middleware/*`, `server/src/utils/supabase.js`: shared logic
- `vercel.json`: function bundling config

## Cleanup notes

- The legacy Express server (`server/src/index.js`, `server/src/app.js`) and `server/package.json` were removed; the app is fully serverless.
- Use `.env` / `.env.local` at repo root (or Vercel envs). See `.env.example`.
