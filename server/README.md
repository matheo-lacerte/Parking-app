# Parking-app Server (Node/Express)

Minimal base server for the Parking-app.

## Structure

- `src/index.js` – entry point, loads env and starts HTTP server
- `src/app.js` – Express app configuration (middleware, routes)
- `src/routes/health.js` – basic health-check route
- `.env.example` – sample environment variables

## Quick start (Windows cmd)

1. Install dependencies:

```
npm install --prefix server
```

2. Copy `.env.example` to `.env` and adjust if needed:

```
copy server\.env.example server\.env
```

3. Start in dev mode (auto-restart):

```
npm run dev --prefix server
```

4. Production start:

```
npm run start --prefix server
```

Server will listen on `http://localhost:4000` by default.

## Health check

Visit:

```
GET http://localhost:4000/health
```

You should receive `{ "status": "ok" }`.
