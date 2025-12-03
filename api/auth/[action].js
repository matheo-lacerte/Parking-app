import {
  getProfile,
  login,
  logout,
  signup,
} from '../../server/src/controllers/AuthController.js';
import { authMiddleware } from '../../server/src/middleware/auth.js';

const runAuthIfNeeded = (requiresAuth) => (req, res) =>
  new Promise((resolve) => {
    if (!requiresAuth) return resolve(true);
    const next = () => resolve(true);
    authMiddleware(req, res, next);
  });

export default async function handler(req, res) {
  const { action } = req.query;

  const routes = {
    getProfile: { methods: ['GET'], handler: getProfile, protected: true },
    login: { methods: ['POST'], handler: login, protected: false },
    logout: { methods: ['POST'], handler: logout, protected: true },
    signup: { methods: ['POST'], handler: signup, protected: false },
  };

  const route = routes[action];
  if (!route) {
    return res.status(404).json({ error: 'Not Found' });
  }

  if (!route.methods.includes(req.method)) {
    res.setHeader('Allow', route.methods.join(', '));
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const ok = await runAuthIfNeeded(route.protected)(req, res);
  if (!ok) return;
  return route.handler(req, res);
}
