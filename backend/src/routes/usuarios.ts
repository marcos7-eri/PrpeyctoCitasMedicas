import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

// GET /api/usuarios
router.get('/', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('perfiles')
      .select('id, nombre_completo, correo, rol, estado, telefono, creado_en, foto_url')
      .order('creado_en', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/usuarios/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre_completo, correo, telefono, rol, estado } = req.body;
    const { data, error } = await supabase
      .from('perfiles')
      .update({ nombre_completo, correo, telefono, rol, estado })
      .eq('id', id)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
