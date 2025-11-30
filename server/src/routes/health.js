import { Router } from 'express';
import { supabase } from '../utils/supabase.js';

const router = Router();

router.get('/', async (req, res) => {
  const startedAt = Date.now();
  let supabase_status = 'unknown';
  let supabase_latency_ms = null;
  let supabase_error = null;
  const hasUrl = !!process.env.SUPABASE_URL;
  const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasAnon = !!process.env.SUPABASE_ANON_KEY;
  try {
    const t0 = Date.now();
    // Requête minimale: récupérer 1 id utilisateur (moins impactant que count exact sur grands volumes)
    const { error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
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

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime_ms: Date.now() - startedAt,
    supabase: {
      status: supabase_status,
      latency_ms: supabase_latency_ms,
      error: supabase_error
    },
    env: {
      supabase_url_present: hasUrl,
      supabase_key_present: hasServiceRole || hasAnon,
      supabase_key_type: hasServiceRole ? 'service_role' : (hasAnon ? 'anon' : null)
    }
  });
});

export default router;
