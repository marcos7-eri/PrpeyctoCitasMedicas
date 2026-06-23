import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CitasService } from './citas.service';
import { SupabaseService } from '../supabase/supabase.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { EventBusService } from '../events/event-bus.service';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * PRUEBAS UNITARIAS — CitasService
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * PRINCIPIO SRP demostrado en pruebas:
 *   Cada test verifica UNA sola responsabilidad del servicio.
 *
 * PRINCIPIO DIP demostrado en pruebas:
 *   CitasService no sabe que sus dependencias son mocks.
 *   Funciona igual con mocks que con implementaciones reales — gracias a DIP.
 *
 * PRINCIPIO DRY demostrado en pruebas:
 *   El mock de Supabase se define una vez y se reutiliza en todos los tests.
 *   No hay duplicación de la lógica de setup.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Helpers de mock (DRY) ────────────────────────────────────────────────────

/** Crea un builder encadenable que simula la API fluent de Supabase */
function crearQueryBuilder(resultado: { data?: any; error?: any }) {
  const builder: any = {
    select:  () => builder,
    insert:  () => builder,
    update:  () => builder,
    delete:  () => builder,
    upsert:  () => builder,
    eq:      () => builder,
    neq:     () => builder,
    in:      () => builder,
    order:   () => builder,
    limit:   () => builder,
    single:  () => Promise.resolve(resultado),
    maybeSingle: () => Promise.resolve(resultado),
    then: (resolve: any) => Promise.resolve(resultado).then(resolve),
  };
  return builder;
}

describe('CitasService', () => {
  let service: CitasService;
  let supabaseMock: jest.Mocked<{ client: any }>;
  let notifMock: jest.Mocked<Partial<NotificacionesService>>;
  let auditMock: jest.Mocked<Partial<AuditoriaService>>;
  let eventBusMock: jest.Mocked<Partial<EventBusService>>;

  beforeEach(async () => {
    // DIP: se inyectan mocks que implementan la misma interfaz que los servicios reales
    supabaseMock = {
      client: {
        from: jest.fn().mockReturnValue(crearQueryBuilder({ data: null, error: null })),
      },
    };

    notifMock    = { create: jest.fn().mockResolvedValue({}) };
    auditMock    = { create: jest.fn().mockResolvedValue({}) };
    eventBusMock = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CitasService,
        { provide: SupabaseService,        useValue: supabaseMock  },
        { provide: NotificacionesService,  useValue: notifMock     },
        { provide: AuditoriaService,       useValue: auditMock     },
        { provide: EventBusService,        useValue: eventBusMock  },
      ],
    }).compile();

    service = module.get<CitasService>(CitasService);
  });

  // ─── SRP: create ────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('debe lanzar BadRequestException cuando faltan campos requeridos', async () => {
      // PRINCIPIO SRP: la validación es una sola responsabilidad del método create
      await expect(service.create({ motivo: 'dolor de cabeza' }))
        .rejects
        .toThrow(BadRequestException);
    });

    it('debe lanzar BadRequestException cuando falta doctor_id', async () => {
      await expect(
        service.create({ paciente_id: 'p1', fecha: '2026-07-01', hora_inicio: '09:00' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar BadRequestException cuando falta paciente_id', async () => {
      await expect(
        service.create({ doctor_id: 'd1', fecha: '2026-07-01', hora_inicio: '09:00' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe crear la cita con estado "pendiente" y emitir evento (Event Driven)', async () => {
      const citaCreada = {
        id: 'cita-uuid-123',
        doctor_id: 'd1',
        paciente_id: 'p1',
        fecha: '2026-07-01',
        hora_inicio: '09:00:00',
        estado: 'pendiente',
      };

      supabaseMock.client.from.mockReturnValue(
        crearQueryBuilder({ data: citaCreada, error: null }),
      );

      const resultado = await service.create({
        doctor_id:   'd1',
        paciente_id: 'p1',
        fecha:       '2026-07-01',
        hora_inicio: '09:00',
        motivo:      'Control anual',
      });

      // Verifica que se devuelve la cita con estado pendiente
      expect(resultado.estado).toBe('pendiente');
      expect(resultado.id).toBe('cita-uuid-123');

      // EVENT DRIVEN: verifica que se emitió el evento CitaCreadaEvent
      expect(eventBusMock.emit).toHaveBeenCalledTimes(1);
      expect(eventBusMock.emit).toHaveBeenCalledWith(
        expect.objectContaining({ tipo: 'cita.creada', citaId: 'cita-uuid-123' }),
      );

      // DRY: verifica que la auditoría fue llamada (audit() centralizado)
      expect(auditMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ accion: 'insert', tabla: 'citas' }),
      );
    });

    it('debe lanzar BadRequestException cuando Supabase retorna error', async () => {
      supabaseMock.client.from.mockReturnValue(
        crearQueryBuilder({ data: null, error: { message: 'foreign key violation' } }),
      );

      await expect(
        service.create({ doctor_id: 'd1', paciente_id: 'p1', fecha: '2026-07-01', hora_inicio: '09:00' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── SRP: remove ───────────────────────────────────────────────────────────

  describe('remove()', () => {
    it('debe retornar { success: true } al eliminar correctamente', async () => {
      supabaseMock.client.from.mockReturnValue(
        crearQueryBuilder({ data: null, error: null }),
      );

      const resultado = await service.remove('cita-uuid-123');
      expect(resultado).toEqual({ success: true });
    });

    it('debe lanzar BadRequestException si Supabase retorna error al eliminar', async () => {
      supabaseMock.client.from.mockReturnValue(
        crearQueryBuilder({ data: null, error: { message: 'row not found' } }),
      );

      await expect(service.remove('id-inexistente')).rejects.toThrow(BadRequestException);
    });
  });

  // ─── DIP: CitasService funciona igual con cualquier implementación ──────────

  describe('DIP — independencia de implementación concreta', () => {
    it('CitasService debe estar definido (inyectado correctamente con mocks)', () => {
      // Prueba que DIP funciona: CitasService opera sin conocer la implementación real
      expect(service).toBeDefined();
    });

    it('EventBusService mock es suficiente — no se necesita la implementación real (DIP)', async () => {
      supabaseMock.client.from.mockReturnValue(
        crearQueryBuilder({ data: { id: 'x1', estado: 'pendiente' }, error: null }),
      );

      await service.create({ doctor_id: 'd1', paciente_id: 'p1', fecha: '2026-07-15', hora_inicio: '10:00' });

      // El mock de EventBusService fue suficiente — DIP desacopla el servicio de su implementación
      expect(eventBusMock.emit).toHaveBeenCalled();
    });
  });

  // ─── DRY: handleDbOperation centraliza errores ─────────────────────────────

  describe('DRY — handleDbOperation centraliza el manejo de errores', () => {
    it('no debe repetir la lógica de manejo de errores en cada método', async () => {
      // Si Supabase falla en findAll, handleDbOperation lo convierte en excepción HTTP
      supabaseMock.client.from.mockReturnValue(
        crearQueryBuilder({ data: null, error: { message: 'connection timeout' } }),
      );

      await expect(service.findAll()).rejects.toThrow(BadRequestException);
    });
  });
});
