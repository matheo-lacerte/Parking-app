# Parking-app

## API Base Configuration

To run locally and on Vercel using the same frontend code, the app reads the API base URL from `VITE_API_BASE_URL`.

- Local development: set it to your local server URL.
	- Windows (cmd.exe):

		```bat
		setx VITE_API_BASE_URL "http://localhost:4000"
		```

	Restart `vite` after changing env vars.

- Vercel (production): set a Project Environment Variable
	- Key: `VITE_API_BASE_URL`
	- Value: `https://<your-app>.vercel.app/api`

If `VITE_API_BASE_URL` is not set, the frontend falls back to `/api`, which works on Vercel.

## Serverless Backend on Vercel

- The Express app in `server/src/app.js` is wrapped for serverless in `api/index.js` using `serverless-http`.
- `vercel.json` includes `server/**` so controllers and routes are bundled.
- Your endpoints will be available under `/api/...` on Vercel.

## Local Backend

- You can keep running your local Express server via `server/src/index.js` on `http://localhost:4000`.
- Frontend fetches use `src/lib/api.js` helper to resolve the correct base automatically.

## Files of interest

- `src/lib/api.js`: API helper for base URL handling
- `api/index.js`: Vercel serverless function entry wrapping Express app
- `vercel.json`: Vercel configuration
