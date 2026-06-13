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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    SupabaseModule,
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
