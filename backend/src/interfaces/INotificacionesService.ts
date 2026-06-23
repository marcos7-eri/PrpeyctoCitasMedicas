/**
 * PRINCIPIO ISP (Interface Segregation Principle):
 * Interfaz específica y mínima para el servicio de notificaciones.
 * Solo expone los métodos que los consumidores externos necesitan.
 * Los módulos como CitasService dependen de esta interfaz, no de la clase concreta.
 *
 * PRINCIPIO DIP (Dependency Inversion Principle):
 * Permite cambiar la implementación de notificaciones
 * (email, SMS, push) sin modificar los módulos que la consumen.
 */
export interface INotificacionesService {
  findAll(usuarioId?: string): Promise<any[]>;
  create(body: {
    usuario_id?: string;
    titulo: string;
    mensaje: string;
    tipo?: string;
  }): Promise<any>;
  update(id: string, body: any): Promise<any>;
  remove(id: string): Promise<{ success: boolean }>;
}
