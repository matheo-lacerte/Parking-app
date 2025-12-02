import { getProfile } from '../../server/src/controllers/AuthController.js';
import authMiddleware from '../../server/src/middleware/auth.js';

const runAuth = (req, res) => new Promise((resolve) => {
  // The middleware calls next() to proceed; if it sends a response, we stop.
  const next = () => resolve(true);
  authMiddleware(req, res, next);
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  const ok = await runAuth(req, res);
  if (!ok) return; // auth middleware already handled the response
  return getProfile(req, res);
}
