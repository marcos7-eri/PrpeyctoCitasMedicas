import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from '../lib/supabase';

type QueryChain = {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
};

const makeChain = (resolved: { data: unknown; error: unknown }): QueryChain => {
  const chain: QueryChain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolved),
  };
  // Hacer el chain thenable para cuando se hace `await query` sin .single()
  (chain as unknown as Promise<unknown>).then = (onfulfilled: unknown) =>
    Promise.resolve(resolved).then(onfulfilled as never);
  vi.mocked(supabase.from).mockReturnValue(chain as never);
  return chain;
};

const CITA = {
  id: 'cita-1',
  doctor_id: 'doc-1',
  paciente_id: 'pac-1',
  fecha: '2026-06-01',
  hora_inicio: '09:00',
  hora_fin: '09:30',
  estado: 'pendiente',
  motivo: 'Consulta general',
};

describe('GET /api/citas', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna lista de citas con status 200', async () => {
    makeChain({ data: [CITA], error: null });

    const res = await request(app).get('/api/citas');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].id).toBe('cita-1');
  });

  it('retorna 400 si Supabase devuelve error', async () => {
    makeChain({ data: null, error: { message: 'DB error' } });

    const res = await request(app).get('/api/citas');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('DB error');
  });

  it('filtra por doctor_id cuando se envía como query param', async () => {
    const chain = makeChain({ data: [CITA], error: null });

    const res = await request(app).get('/api/citas?doctor_id=doc-1');
    expect(res.status).toBe(200);
    expect(chain.eq).toHaveBeenCalledWith('doctor_id', 'doc-1');
  });
});

describe('POST /api/citas', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 400 si faltan campos requeridos', async () => {
    const res = await request(app)
      .post('/api/citas')
      .send({ doctor_id: 'doc-1', paciente_id: 'pac-1' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('requeridos');
  });

  it('crea una cita y retorna 201 con los datos', async () => {
    makeChain({ data: CITA, error: null });

    const res = await request(app).post('/api/citas').send({
      doctor_id: 'doc-1',
      paciente_id: 'pac-1',
      fecha: '2026-06-01',
      hora_inicio: '09:00',
      hora_fin: '09:30',
      motivo: 'Consulta general',
    });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('cita-1');
    expect(res.body.estado).toBe('pendiente');
  });

  it('retorna 400 si Supabase falla al insertar', async () => {
    makeChain({ data: null, error: { message: 'Horario no disponible' } });

    const res = await request(app).post('/api/citas').send({
      doctor_id: 'doc-1',
      paciente_id: 'pac-1',
      fecha: '2026-06-01',
      hora_inicio: '09:00',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Horario no disponible');
  });
});

describe('PUT /api/citas/:id', () => {
  beforeEach(() => vi.clearAllMocks());

  it('actualiza estado de la cita y retorna 200', async () => {
    const updated = { ...CITA, estado: 'confirmada' };
    makeChain({ data: updated, error: null });

    const res = await request(app)
      .put('/api/citas/cita-1')
      .send({ estado: 'confirmada' });

    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('confirmada');
  });

  it('retorna 400 si Supabase falla al actualizar', async () => {
    makeChain({ data: null, error: { message: 'Cita no encontrada' } });

    const res = await request(app)
      .put('/api/citas/inexistente')
      .send({ estado: 'cancelada' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Cita no encontrada');
  });
});

describe('DELETE /api/citas/:id', () => {
  beforeEach(() => vi.clearAllMocks());

  it('elimina la cita y retorna success true', async () => {
    const chain = makeChain({ data: null, error: null });
    chain.eq.mockResolvedValue({ error: null });

    const res = await request(app).delete('/api/citas/cita-1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('retorna 400 si hay error al eliminar', async () => {
    const chain = makeChain({ data: null, error: null });
    chain.eq.mockResolvedValue({ error: { message: 'No se puede eliminar' } });

    const res = await request(app).delete('/api/citas/cita-1');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('No se puede eliminar');
  });
});
