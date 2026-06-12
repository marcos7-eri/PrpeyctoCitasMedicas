import { HorariosService } from './horarios.service';
export declare class HorariosController {
    private readonly horariosService;
    constructor(horariosService: HorariosService);
    findAll(doctorId?: string, diaSemana?: string, activo?: string): Promise<{
        id: any;
        doctor_id: any;
        dia_semana: any;
        hora_inicio: any;
        hora_fin: any;
        duracion_cita: any;
        activo: any;
        creado_en: any;
        doctores: {
            perfiles: {
                nombre_completo: any;
            }[];
            especialidades: {
                nombre: any;
            }[];
        }[];
    }[]>;
    create(body: any): Promise<any>;
    update(id: string, body: any): Promise<any>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
