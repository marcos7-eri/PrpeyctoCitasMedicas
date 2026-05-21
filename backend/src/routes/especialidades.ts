import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

// GET /api/especialidades
router.get('/', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('especialidades')
      .select('id, nombre, descripcion')
      .order('nombre', { ascending: true });
    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/especialidades
router.post('/', async (req: Request, res: Response) => {
  try {
    const { nombre, descripcion } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ error: 'Nombre es requerido' });
    const { data, error } = await supabase
      .from('especialidades')
      .insert({ nombre: nombre.trim(), descripcion: descripcion?.trim() || null })
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json(data);
  } catch {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/especialidades/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ error: 'Nombre es requerido' });
    const { data, error } = await supabase
      .from('especialidades')
      .update({ nombre: nombre.trim(), descripcion: descripcion?.trim() || null })
      .eq('id', id)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/especialidades/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('especialidades').delete().eq('id', id);
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
