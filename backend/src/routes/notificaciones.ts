import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

// GET /api/notificaciones
router.get('/', async (req: Request, res: Response) => {
  try {
    const { usuario_id } = req.query;
    let query = supabase
      .from('notificaciones')
      .select('id, usuario_id, titulo, mensaje, tipo, leido, fecha_envio')
      .order('fecha_envio', { ascending: false });

    if (usuario_id) query = query.eq('usuario_id', String(usuario_id));

    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/notificaciones
router.post('/', async (req: Request, res: Response) => {
  try {
    const { usuario_id, titulo, mensaje, tipo } = req.body;
    if (!titulo?.trim() || !mensaje?.trim()) {
      return res.status(400).json({ error: 'Título y mensaje son requeridos' });
    }
    const { data, error } = await supabase
      .from('notificaciones')
      .insert({ usuario_id: usuario_id || null, titulo: titulo.trim(), mensaje: mensaje.trim(), tipo: tipo || 'info', leido: false })
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json(data);
  } catch {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/notificaciones/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { leido, titulo, mensaje, tipo } = req.body;
    const updateData: Record<string, unknown> = {};
    if (leido !== undefined) updateData.leido = leido;
    if (titulo !== undefined) updateData.titulo = titulo;
    if (mensaje !== undefined) updateData.mensaje = mensaje;
    if (tipo !== undefined) updateData.tipo = tipo;
    const { data, error } = await supabase.from('notificaciones').update(updateData).eq('id', id).select().single();
    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/notificaciones/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('notificaciones').delete().eq('id', id);
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
