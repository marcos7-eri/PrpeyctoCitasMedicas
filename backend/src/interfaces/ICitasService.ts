/**
 * PRINCIPIO ISP (Interface Segregation Principle):
 * Interfaz específica para el servicio de citas.
 * Los clientes solo dependen de los métodos que realmente usan.
 *
 * PRINCIPIO DIP (Dependency Inversion Principle):
 * Los módulos de alto nivel (Controller) dependen de esta abstracción,
 * no de la implementación concreta (CitasService).
 *
 * ARQUITECTURA LAYERED: este contrato define la frontera entre
 * la capa de presentación (Controller) y la capa de lógica de negocio (Service).
 */
export interface ICitasService {
  findAll(doctorId?: string, pacienteId?: string): Promise<any[]>;
  create(body: any): Promise<any>;
  update(id: string, body: any): Promise<any>;
  confirmar(id: string): Promise<any>;
  completar(id: string): Promise<any>;
  cancelar(id: string, motivo?: string): Promise<any>;
  reagendar(id: string, nuevaFecha: string, nuevaHoraInicio: string, duracion: number): Promise<any>;
  remove(id: string): Promise<{ success: boolean }>;
}
