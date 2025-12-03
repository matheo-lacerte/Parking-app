import { authMiddleware } from '../server/src/middleware/auth.js';
import {
	getHouseholdMembers,
	getHouseholdInfo,
	quitHousehold,
	inviteMember,
	acceptInvite,
	cancelInvite,
} from '../server/src/controllers/householdController.js';
import getProfile from './auth/getProfile.js';
import loginHandler from './auth/login.js';
import logoutHandler from './auth/logout.js';
import signupHandler from './auth/signup.js';
import observationsByDate from './observations/byDate.js';
import healthHandler from './health/index.js';

// Add tiny response helpers to mimic Express API on Vercel/Node ServerResponse
function enhanceRes(res) {
	if (typeof res.status !== 'function') {
		res.status = (code) => { res.statusCode = code; return res; };
	}
	if (typeof res.json !== 'function') {
		res.json = (obj) => {
			try { res.setHeader('content-type', 'application/json'); } catch {}
			res.end(JSON.stringify(obj));
		};
	}
	if (typeof res.send !== 'function') {
		res.send = (body) => {
			if (body === undefined || body === null) return res.end('');
			if (typeof body === 'object') return res.json(body);
			try { res.setHeader('content-type', 'text/plain; charset=utf-8'); } catch {}
			return res.end(String(body));
		};
	}
	return res;
}

const runAuth = (req, res) => new Promise((resolve) => {
	const next = () => resolve(true);
	authMiddleware(req, res, next);
});

export default async function handler(req, res) {
	try {
	enhanceRes(res);
	const url = new URL(req.url, 'http://localhost');
	const path = url.pathname.replace(/^\/api/, '');

	// Ensure JSON body is parsed for POST/PUT/PATCH with application/json
	const methodHasBody = req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH';
	const isJson = (req.headers['content-type'] || '').includes('application/json');
	if (methodHasBody && isJson) {
		try {
			// Always read request stream to build a proper JSON body
			const chunks = [];
			await new Promise((resolve, reject) => {
				req.on('data', (c) => chunks.push(c));
				req.on('end', resolve);
				req.on('error', reject);
			});
			const raw = Buffer.concat(chunks).toString('utf8');
			req.body = raw ? JSON.parse(raw) : {};
		} catch (e) {
			return res.status(400).json({ error: 'Invalid JSON body' });
		}
	} else if (req.body === undefined) {
		// Ensure handlers can safely destructure
		req.body = {};
	}

	// Household
	if (path === '/household/members') {
		if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Method Not Allowed' }); }
		const ok = await runAuth(req, res); if (!ok) return;
		return getHouseholdMembers(req, res);
	}
	if (path === '/household/address') {
		if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Method Not Allowed' }); }
		const ok = await runAuth(req, res); if (!ok) return;
		return getHouseholdInfo(req, res);
	}
	if (path === '/household/quit') {
		if (req.method !== 'DELETE' && req.method !== 'UPDATE') { res.setHeader('Allow', 'DELETE, UPDATE'); return res.status(405).json({ error: 'Method Not Allowed' }); }
		const ok = await runAuth(req, res); if (!ok) return;
		return quitHousehold(req, res);
	}
	if (path === '/household/invite') {
		if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method Not Allowed' }); }
		const ok = await runAuth(req, res); if (!ok) return;
		return inviteMember(req, res);
	}
	if (path === '/household/accept') {
		if (req.method !== 'POST' && req.method !== 'PUT') { res.setHeader('Allow', 'POST, PUT'); return res.status(405).json({ error: 'Method Not Allowed' }); }
		const ok = await runAuth(req, res); if (!ok) return;
		return acceptInvite(req, res);
	}
	if (path === '/household/cancel') {
		if (req.method !== 'POST' && req.method !== 'DELETE') { res.setHeader('Allow', 'POST, DELETE'); return res.status(405).json({ error: 'Method Not Allowed' }); }
		const ok = await runAuth(req, res); if (!ok) return;
		return cancelInvite(req, res);
	}

	// Auth
	if (path === '/auth/getProfile') {
		if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Method Not Allowed' }); }
		const ok = await runAuth(req, res); if (!ok) return;
		return getProfile(req, res);
	}
	if (path === '/auth/login') {
		if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method Not Allowed' }); }
		return loginHandler(req, res);
	}
	if (path === '/auth/logout') {
		if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method Not Allowed' }); }
		const ok = await runAuth(req, res); if (!ok) return;
		return logoutHandler(req, res);
	}
	if (path === '/auth/signup') {
		if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method Not Allowed' }); }
		return signupHandler(req, res);
	}

	// Observations
	if (path === '/observations/byDate') {
		if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Method Not Allowed' }); }
		const ok = await runAuth(req, res); if (!ok) return;
		return observationsByDate(req, res);
	}

	// Health
	if (path === '/health') {
		if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Method Not Allowed' }); }
		return healthHandler(req, res);
	}

	return res.status(404).json({ error: 'Not Found' });
	} catch (err) {
		console.error('[api] Unhandled error', err);
		try {
			return res.status(500).json({ error: 'Internal Server Error', details: err?.message });
		} catch {
			res.statusCode = 500;
			res.end('Internal Server Error');
		}
	}
}
