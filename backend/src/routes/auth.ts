import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { correo, password } = req.body;
    if (!correo || !password) {
      return res.status(400).json({ error: 'Correo y contraseña son requeridos' });
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email: correo, password });
    if (error) return res.status(401).json({ error: error.message });

    const { data: perfil } = await supabase
      .from('perfiles')
      .select('id, nombre_completo, correo, rol, estado')
      .eq('id', data.user.id)
      .single();

    return res.json({ user: data.user, session: data.session, perfil });
  } catch {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/auth/logout
router.post('/logout', async (_req: Request, res: Response) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
