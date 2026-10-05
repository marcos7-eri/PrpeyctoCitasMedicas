import { BadRequestException } from '@nestjs/common';
import { CitasService } from './citas.service';

describe('Validación de reservas SCRUM-5', () => {
  const input = { doctor_id: 'd1', paciente_id: 'p1', fecha: '2026-10-10', hora_inicio: '09:00', hora_fin: '09:30' };
  let service: CitasService;
  let from: jest.Mock;
  let insert: jest.Mock;
  let lookup: { data: unknown[] | null; error: unknown };

  beforeEach(() => {
    lookup = { data: [], error: null };
    insert = jest.fn();
    const query: any = {};
    for (const method of ['select', 'eq', 'in']) query[method] = jest.fn(() => query);
    query.limit = jest.fn(async () => lookup);
    query.insert = insert.mockReturnValue(query);
    query.single = jest.fn(async () => ({ data: { id: 'c1', estado: 'pendiente' }, error: null }));
    from = jest.fn(() => query);
    service = new CitasService(
      { client: { from } } as any,
      { create: jest.fn() } as any,
      { create: jest.fn().mockResolvedValue({}) } as any,
      { emit: jest.fn() } as any,
    );
  });

  it.each([undefined, {}, { ...input, fecha: '2026-02-30' }, { ...input, fecha: '10/10/2026' },
    { ...input, hora_inicio: '24:00' }, { ...input, hora_inicio: '09:99' },
    { ...input, hora_fin: '08:30' }])('rechaza entrada inválida antes de consultar la base', async body => {
    await expect(service.create(body)).rejects.toThrow(BadRequestException);
    expect(from).not.toHaveBeenCalled();
  });

  it('rechaza un horario ocupado sin insertar otra cita', async () => {
    lookup.data = [{ id: 'otra-cita' }];
    await expect(service.create(input)).rejects.toThrow('ya está ocupado');
    expect(insert).not.toHaveBeenCalled();
  });

  it('no permite reservar si falla la consulta de disponibilidad', async () => {
    lookup = { data: null, error: { message: 'internal schema details' } };
    await expect(service.create(input)).rejects.toThrow('No se pudo comprobar');
    expect(insert).not.toHaveBeenCalled();
  });

  it('normaliza la hora y crea una cita pendiente', async () => {
    await expect(service.create(input)).resolves.toEqual({ id: 'c1', estado: 'pendiente' });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ hora_inicio: '09:00:00', estado: 'pendiente' }));
  });
});
