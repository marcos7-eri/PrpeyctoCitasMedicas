import { NotificacionesService } from './notificaciones.service';
export declare class NotificacionesController {
    private readonly notificacionesService;
    constructor(notificacionesService: NotificacionesService);
    findAll(usuarioId?: string): Promise<{
        id: any;
        usuario_id: any;
        titulo: any;
        mensaje: any;
        tipo: any;
        leido: any;
        fecha_envio: any;
        perfiles: {
            nombre_completo: any;
            correo: any;
        }[];
    }[]>;
    create(body: any): Promise<any>;
    update(id: string, body: any): Promise<any>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
