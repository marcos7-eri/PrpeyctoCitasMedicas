import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { DoctoresModule } from './doctores/doctores.module';
import { EspecialidadesModule } from './especialidades/especialidades.module';
import { PacientesModule } from './pacientes/pacientes.module';
import { CitasModule } from './citas/citas.module';
import { HorariosModule } from './horarios/horarios.module';
import { NotificacionesModule } from './notificaciones/notificaciones.module';
import { AuditoriaModule } from './auditoria/auditoria.module';
import { IaModule } from './ia/ia.module';
import { HistorialMedicoModule } from './historial-medico/historial-medico.module';
import { RecordatoriosModule } from './recordatorios/recordatorios.module';
import { EstadisticasModule } from './estadisticas/estadisticas.module';
import { EventsModule } from './events/events.module';

/**
 * ARQUITECTURA LAYERED — Módulo raíz de la aplicación.
 * Registra todas las capas del sistema y su infraestructura transversal.
 *
 * ARQUITECTURA MICROSERVICES (estructura modular):
 * Cada módulo importado es autónomo — tiene su propio Controller, Service y Module.
 * Esta independencia refleja los principios de los microservicios aunque corran
 * en un mismo proceso (monolito modular), facilitando una futura extracción a
 * microservicios reales sin reescribir la lógica de negocio.
 *
 * ARQUITECTURA CLIENT-SERVER:
 * AppModule es el punto de entrada del servidor. Expone todos los endpoints REST
 * que los clientes (frontend Next.js, app móvil React Native) consumen.
 *
 * ARQUITECTURA EVENT DRIVEN:
 * EventsModule se registra como @Global() — el EventBusService queda disponible
 * en todos los módulos sin necesidad de importarlo explícitamente en cada uno.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    // Infraestructura transversal — debe ir antes que los módulos de dominio
    EventsModule,        // Bus de eventos global (Event Driven Architecture)
    SupabaseModule,
    // Módulos de dominio — cada uno es autónomo (Microservices principle)
    AuthModule,
    UsuariosModule,
    DoctoresModule,
    EspecialidadesModule,
    PacientesModule,
    CitasModule,
    HorariosModule,
    NotificacionesModule,
    AuditoriaModule,
    IaModule,
    HistorialMedicoModule,
    RecordatoriosModule,
    EstadisticasModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
