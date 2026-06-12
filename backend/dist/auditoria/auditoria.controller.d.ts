import { AuditoriaService } from './auditoria.service';
export declare class AuditoriaController {
    private readonly auditoriaService;
    constructor(auditoriaService: AuditoriaService);
    findAll(limit?: string): Promise<{
        id: any;
        usuario_id: any;
        accion: any;
        tabla: any;
        registro_id: any;
        detalles: any;
        creado_en: any;
        perfiles: {
            nombre_completo: any;
            correo: any;
        }[];
    }[]>;
    create(body: any): Promise<any>;
}
