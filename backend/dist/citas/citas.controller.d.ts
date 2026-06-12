import { CitasService } from './citas.service';
export declare class CitasController {
    private readonly citasService;
    constructor(citasService: CitasService);
    findAll(doctorId?: string, pacienteId?: string): Promise<{
        id: any;
        doctor_id: any;
        paciente_id: any;
        fecha: any;
        hora_inicio: any;
        hora_fin: any;
        estado: any;
        motivo: any;
        notas: any;
        motivo_cancelacion: any;
        creado_por: any;
        creado_en: any;
        doctores: {
            perfiles: {
                nombre_completo: any;
            }[];
            especialidades: {
                nombre: any;
            }[];
        }[];
        pacientes: {
            perfiles: {
                nombre_completo: any;
                correo: any;
            }[];
        }[];
    }[]>;
    create(body: any): Promise<any>;
    update(id: string, body: any): Promise<any>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
