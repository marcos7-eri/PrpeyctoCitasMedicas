import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

// GET /api/citas
router.get('/', async (req: Request, res: Response) => {
  try {
    const { doctor_id, paciente_id } = req.query;
    let query = supabase
      .from('citas')
      .select('id, doctor_id, paciente_id, fecha, hora_inicio, hora_fin, estado, motivo, doctores(perfiles(nombre_completo), especialidades(nombre)), pacientes(perfiles(nombre_completo, correo))')
      .order('fecha', { ascending: false });

    if (doctor_id) query = query.eq('doctor_id', String(doctor_id));
    if (paciente_id) query = query.eq('paciente_id', String(paciente_id));

    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/citas
router.post('/', async (req: Request, res: Response) => {
  try {
    const { doctor_id, paciente_id, fecha, hora_inicio, hora_fin, motivo } = req.body;
    if (!doctor_id || !paciente_id || !fecha || !hora_inicio) {
      return res.status(400).json({ error: 'doctor_id, paciente_id, fecha y hora_inicio son requeridos' });
    }
    const { data, error } = await supabase
      .from('citas')
      .insert({ doctor_id, paciente_id, fecha, hora_inicio, hora_fin, motivo, estado: 'pendiente' })
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json(data);
  } catch {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/citas/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { estado, motivo, hora_inicio, hora_fin, fecha } = req.body;
    const updateData: Record<string, unknown> = {};
    if (estado !== undefined) updateData.estado = estado;
    if (motivo !== undefined) updateData.motivo = motivo;
    if (hora_inicio !== undefined) updateData.hora_inicio = hora_inicio;
    if (hora_fin !== undefined) updateData.hora_fin = hora_fin;
    if (fecha !== undefined) updateData.fecha = fecha;
    const { data, error } = await supabase.from('citas').update(updateData).eq('id', id).select().single();
    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/citas/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('citas').delete().eq('id', id);
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
