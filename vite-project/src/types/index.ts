export interface Perfil {
  id: string;
  nombre_completo: string;
  correo: string;
  telefono?: string;
  rol: 'admin' | 'doctor' | 'paciente';
  estado: 'activo' | 'inactivo';
  creado_en?: string;
}