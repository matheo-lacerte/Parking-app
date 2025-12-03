import {
  getHouseholdMembers,
  inviteMember,
  acceptInvite,
  cancelInvite,
  getHouseholdInfo,
  quitHousehold,
} from '../../server/src/controllers/householdController.js';
import { authMiddleware } from '../../server/src/middleware/auth.js';

const runAuth = (req, res) =>
  new Promise((resolve) => {
    const next = () => resolve(true);
    authMiddleware(req, res, next);
  });

export default async function handler(req, res) {
  const { action } = req.query;

  const routes = {
    members: { methods: ['GET'], handler: getHouseholdMembers },
    invite: { methods: ['POST'], handler: inviteMember },
    accept: { methods: ['POST', 'PUT'], handler: acceptInvite },
    cancel: { methods: ['POST', 'DELETE'], handler: cancelInvite },
    address: { methods: ['GET'], handler: getHouseholdInfo },
    quit: { methods: ['DELETE', 'UPDATE'], handler: quitHousehold },
  };

  const route = routes[action];
  if (!route) {
    return res.status(404).json({ error: 'Not Found' });
  }

  if (!route.methods.includes(req.method)) {
    res.setHeader('Allow', route.methods.join(', '));
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const ok = await runAuth(req, res);
  if (!ok) return;
  return route.handler(req, res);
}
