import { supabase } from '../utils/supabase.js';

// Middleware d'authentification basé sur un Bearer token Supabase
// Usage: router.get('/secure', authMiddleware, handler)
export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization manquante (Bearer).' });
    }
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token manquant.' });

    // Vérifier le token auprès de Supabase
    const { data, error } = await supabase.auth.getUser(token);
    if (error) {
      return res.status(401).json({ error: 'Token invalide.' });
    }
    const user = data?.user;
    if (!user) return res.status(401).json({ error: 'Utilisateur non reconnu.' });

    // Récupérer profil dans table users
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return res.status(500).json({ error: 'Erreur récupération profil.' });
    }

    // Attacher au request pour les handlers suivants
    req.authUser = user;        // user Supabase
    req.userProfile = profile;  // ligne de la table users
    next();
  } catch (e) {
    console.error('authMiddleware error:', e);
    return res.status(500).json({ error: 'Erreur interne auth.' });
  }
};

export default authMiddleware;