import { getHouseholdAddress } from '../../server/src/controllers/householdController.js';
import { authMiddleware } from '../../server/src/middleware/auth.js';

const runAuth = (req, res) => new Promise((resolve) => {
  const next = () => resolve(true);
  authMiddleware(req, res, next);
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  const ok = await runAuth(req, res);
  if (!ok) return;
  return getHouseholdAddress(req, res);
}
