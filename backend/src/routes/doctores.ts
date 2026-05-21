import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

// GET /api/doctores
router.get('/', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('doctores')
      .select('id, perfil_id, especialidad_id, numero_licencia, activo, perfiles(nombre_completo, correo, telefono), especialidades(nombre)')
      .order('id', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/doctores
router.post('/', async (req: Request, res: Response) => {
  try {
    const { perfil_id, especialidad_id, numero_licencia } = req.body;
    if (!perfil_id || !especialidad_id) {
      return res.status(400).json({ error: 'perfil_id y especialidad_id son requeridos' });
    }
    const { data, error } = await supabase
      .from('doctores')
      .insert({ perfil_id, especialidad_id, numero_licencia, activo: true })
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json(data);
  } catch {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/doctores/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { especialidad_id, numero_licencia, activo } = req.body;
    const { data, error } = await supabase
      .from('doctores')
      .update({ especialidad_id, numero_licencia, activo })
      .eq('id', id)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/doctores/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('doctores').delete().eq('id', id);
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
