import { authMiddleware } from '../server/src/middleware/auth.js';
import {
	getHouseholdMembers,
	getHouseholdInfo,
	quitHousehold,
	inviteMember,
	acceptInvite,
	cancelInvite,
} from '../server/src/controllers/householdController.js';
import { login, logout, signup, getProfile as getProfileController } from '../server/src/controllers/AuthController.js';
import { getObservationsByDate } from '../server/src/controllers/signalController.js';
import { supabaseAdmin, supabasePublic } from '../server/src/utils/supabase.js';

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
		return getProfileController(req, res);
	}
	if (path === '/auth/login') {
		if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method Not Allowed' }); }
		return login(req, res);
	}
	if (path === '/auth/logout') {
		if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method Not Allowed' }); }
		const ok = await runAuth(req, res); if (!ok) return;
		return logout(req, res);
	}
	if (path === '/auth/signup') {
		if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method Not Allowed' }); }
		return signup(req, res);
	}

	// Observations
	if (path === '/observations/byDate') {
		if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Method Not Allowed' }); }
		const ok = await runAuth(req, res); if (!ok) return;
		return getObservationsByDate(req, res);
	}

	// Health
	if (path === '/health') {
		if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Method Not Allowed' }); }
		const startedAt = Date.now();
		let supabase_status = 'unknown';
		let supabase_latency_ms = null;
		let supabase_error = null;
		const hasUrl = !!process.env.SUPABASE_URL;
		const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
		const hasAnon = !!process.env.SUPABASE_ANON_KEY;
		try {
			const t0 = Date.now();
			const client = supabaseAdmin || supabasePublic;
			const { error } = await client.from('users').select('id').limit(1);
			supabase_latency_ms = Date.now() - t0;
			if (error) {
				supabase_status = 'error';
				supabase_error = error.message || String(error);
			} else {
				supabase_status = 'ok';
			}
		} catch (e) {
			supabase_status = 'exception';
			supabase_error = e.message || String(e);
		}

		return res.json({
			status: 'ok',
			timestamp: new Date().toISOString(),
			uptime_ms: Date.now() - startedAt,
			supabase: {
				status: supabase_status,
				latency_ms: supabase_latency_ms,
				error: supabase_error,
			},
			env: {
				supabase_url_present: hasUrl,
				supabase_key_present: hasServiceRole || hasAnon,
				supabase_key_type: hasServiceRole ? 'service_role' : hasAnon ? 'anon' : null,
			},
		});
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
