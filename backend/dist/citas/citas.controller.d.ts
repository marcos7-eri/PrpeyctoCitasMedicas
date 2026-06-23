import { CitasService } from './citas.service';
export declare class CitasController {
    private readonly citasService;
    constructor(citasService: CitasService);
    findAll(doctorId?: string, pacienteId?: string): Promise<any[]>;
    create(body: any): Promise<any>;
    update(id: string, body: any): Promise<any>;
    confirmar(id: string): Promise<any>;
    completar(id: string): Promise<any>;
    cancelar(id: string, body: any): Promise<any>;
    reagendar(id: string, body: any): Promise<any>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
