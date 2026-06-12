import { EspecialidadesService } from './especialidades.service';
export declare class EspecialidadesController {
    private readonly especialidadesService;
    constructor(especialidadesService: EspecialidadesService);
    findAll(): Promise<{
        id: any;
        nombre: any;
        descripcion: any;
    }[]>;
    create(body: any): Promise<any>;
    update(id: string, body: any): Promise<any>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
