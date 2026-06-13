import { DoctoresService } from './doctores.service';
export declare class DoctoresController {
    private readonly doctoresService;
    constructor(doctoresService: DoctoresService);
    findAll(perfilId?: string): Promise<{
        id: any;
        perfil_id: any;
        especialidad_id: any;
        numero_licencia: any;
        anios_experiencia: any;
        costo_consulta: any;
        biografia: any;
        perfiles: {
            nombre_completo: any;
            correo: any;
            telefono: any;
            estado: any;
        }[];
        especialidades: {
            nombre: any;
        }[];
    }[]>;
    create(body: any): Promise<any>;
    update(id: string, body: any): Promise<any>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
