import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
