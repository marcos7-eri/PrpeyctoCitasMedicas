import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(),
  },
}));

import { supabase } from '../lib/supabase';

const mockFrom = (data: unknown, error: unknown = null) => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
  };
  vi.mocked(supabase.from).mockReturnValue(chain as never);
  return chain;
};

describe('POST /api/auth/login', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 400 si faltan correo o password', async () => {
    const res = await request(app).post('/api/auth/login').send({ correo: 'a@a.com' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Correo y contraseña son requeridos');
  });

  it('retorna 401 si las credenciales son incorrectas', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    } as never);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'x@x.com', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid login credentials');
  });

  it('retorna 200 con user, session y perfil en login exitoso', async () => {
    const fakeUser = { id: 'user-1', email: 'doc@clinica.com' };
    const fakeSession = { access_token: 'token-abc' };

    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: fakeUser, session: fakeSession },
      error: null,
    } as never);

    mockFrom({ id: 'user-1', nombre_completo: 'Dr. García', correo: 'doc@clinica.com', rol: 'doctor', estado: 'activo' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'doc@clinica.com', password: 'pass123' });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ id: 'user-1' });
    expect(res.body.session).toMatchObject({ access_token: 'token-abc' });
    expect(res.body.perfil).toMatchObject({ rol: 'doctor' });
  });
});

describe('POST /api/auth/logout', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 200 con success en logout exitoso', async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null } as never);

    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('retorna 400 si hay error al cerrar sesión', async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValue({
      error: { message: 'No active session' },
    } as never);

    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('No active session');
  });
});
