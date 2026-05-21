import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

// GET /api/auditoria
router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(String(req.query.limit || '100'));
    const { data, error } = await supabase
      .from('auditoria')
      .select('id, usuario_id, accion, tabla, registro_id, detalles, creado_en')
      .order('creado_en', { ascending: false })
      .limit(limit);
    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/auditoria
router.post('/', async (req: Request, res: Response) => {
  try {
    const { usuario_id, accion, tabla, registro_id, detalles } = req.body;
    if (!accion || !tabla) {
      return res.status(400).json({ error: 'accion y tabla son requeridos' });
    }
    const { data, error } = await supabase
      .from('auditoria')
      .insert({ usuario_id: usuario_id || null, accion, tabla, registro_id: registro_id || null, detalles: detalles || null })
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json(data);
  } catch {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
