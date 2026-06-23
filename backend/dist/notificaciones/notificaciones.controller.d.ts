import { NotificacionesService } from './notificaciones.service';
export declare class NotificacionesController {
    private readonly notificacionesService;
    constructor(notificacionesService: NotificacionesService);
    findAll(usuarioId?: string): Promise<any[]>;
    create(body: any): Promise<any>;
    update(id: string, body: any): Promise<any>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
