export interface Perfil {
  id: string;
  nombre_completo: string;
  correo: string;
  telefono: string;
  rol: string;
  estado: string;
  creado_en: string;
  foto_url?: string;
}

export interface Paciente {
  id: string;
  perfil_id: string;
  fecha_nacimiento?: string;
  genero?: string;
  tipo_sangre?: string;
  direccion?: string;
  contacto_emergencia_nombre?: string;
  contacto_emergencia_telefono?: string;
  creado_en: string;
}

export interface Especialidad {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface Doctor {
  id: string;
  perfil_id: string;
  especialidad_id: number;
  numero_licencia?: string;
  anios_experiencia?: number;
  costo_consulta?: number;
  biografia?: string;
  creado_en: string;
  perfiles?: Perfil;
  especialidades?: Especialidad;
}

export interface Horario {
  id: number;
  doctor_id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  duracion_cita: number;
  activo: boolean;
}

export type EstadoCita = 'pendiente' | 'confirmada' | 'cancelada' | 'completada';

export interface Cita {
  id: number;
  paciente_id: string;
  doctor_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin?: string;
  estado: EstadoCita;
  motivo?: string;
  notas?: string;
  motivo_cancelacion?: string;
  creado_en: string;
  doctores?: Doctor;
}

export interface Notificacion {
  id: number;
  usuario_id: string;
  titulo: string;
  mensaje: string;
  tipo: string;
  leido: boolean;
  fecha_envio: string;
}

export interface HistorialMedico {
  id: number;
  paciente_id: string;
  doctor_id: string;
  cita_id: number;
  sintomas?: string;
  diagnostico?: string;
  tratamiento?: string;
  observaciones?: string;
  fecha_registro: string;
  doctores?: Doctor;
}
