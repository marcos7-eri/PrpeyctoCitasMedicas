import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * PRINCIPIOS Y ARQUITECTURAS APLICADOS EN ESTA CLASE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ARQUITECTURA LAYERED — Capa de Acceso a Datos (Data Access Layer):
 *   SupabaseService es la capa más baja del backend.
 *   Todos los servicios de dominio (CitasService, PacientesService, etc.)
 *   acceden a la base de datos ÚNICAMENTE a través de esta clase.
 *   Ninguna capa superior conoce los detalles de Supabase ni de PostgreSQL.
 *
 * PRINCIPIO SRP (Single Responsibility Principle):
 *   SupabaseService tiene UNA sola responsabilidad: proveer el cliente de BD.
 *   No contiene lógica de negocio, validaciones ni transformaciones de datos.
 *   Si se migra de Supabase a otro ORM (Prisma, TypeORM), solo cambia este archivo.
 *
 * PRINCIPIO DIP (Dependency Inversion Principle):
 *   Los servicios de dominio dependen de SupabaseService (abstracción de acceso a datos),
 *   no de `createClient` de Supabase directamente.
 *   Esto permite cambiar el proveedor de BD sin modificar la lógica de negocio.
 *
 * PRINCIPIO DRY (Don't Repeat Yourself):
 *   La inicialización del cliente de Supabase ocurre UNA sola vez aquí.
 *   Todos los módulos reutilizan esta instancia mediante inyección de dependencias.
 *   Sin esta clase, cada servicio crearía su propio cliente — duplicación masiva.
 *
 * PRINCIPIO YAGNI (You Aren't Gonna Need It):
 *   No se implementa un pool de conexiones ni caché de queries porque Supabase
 *   gestiona eso internamente. No se agrega complejidad que no es necesaria.
 * ─────────────────────────────────────────────────────────────────────────────
 */
@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);

  // SRP: el cliente es privado — ningún módulo externo puede reemplazarlo o reasignarlo
  private supabaseClient: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    // Validación de configuración en la capa de datos — no en la lógica de negocio (SRP)
    if (!supabaseUrl || !supabaseKey) {
      this.logger.error('SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no están configurados.');
      throw new Error('Supabase configuration is missing');
    }

    // DRY: instancia única del cliente — compartida por todos los servicios via DI
    this.supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,  // servidor no necesita refrescar tokens automáticamente
        persistSession:   false,  // sesiones son stateless en el servidor
      },
    });
  }

  /**
   * LAYERED: único punto de salida hacia la capa de datos.
   * Todos los servicios usan `supabaseService.client.from(...)` — nunca `createClient` directamente.
   */
  get client(): SupabaseClient {
    return this.supabaseClient;
  }
}
