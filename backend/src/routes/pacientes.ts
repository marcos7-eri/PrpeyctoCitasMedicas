import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

// GET /api/pacientes
router.get('/', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('pacientes')
      .select('id, perfil_id, fecha_nacimiento, genero, tipo_sangre, alergias, contacto_emergencia_nombre, contacto_emergencia_telefono, perfiles(nombre_completo, correo, telefono, estado)')
      .order('id', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/pacientes
router.post('/', async (req: Request, res: Response) => {
  try {
    const { perfil_id, fecha_nacimiento, genero, tipo_sangre, alergias, contacto_emergencia_nombre, contacto_emergencia_telefono } = req.body;
    if (!perfil_id) return res.status(400).json({ error: 'perfil_id es requerido' });
    const { data, error } = await supabase
      .from('pacientes')
      .insert({ perfil_id, fecha_nacimiento, genero, tipo_sangre, alergias, contacto_emergencia_nombre, contacto_emergencia_telefono })
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json(data);
  } catch {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/pacientes/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { fecha_nacimiento, genero, tipo_sangre, alergias, contacto_emergencia_nombre, contacto_emergencia_telefono } = req.body;
    const { data, error } = await supabase
      .from('pacientes')
      .update({ fecha_nacimiento, genero, tipo_sangre, alergias, contacto_emergencia_nombre, contacto_emergencia_telefono })
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
