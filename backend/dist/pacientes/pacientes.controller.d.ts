import { PacientesService } from './pacientes.service';
export declare class PacientesController {
    private readonly pacientesService;
    constructor(pacientesService: PacientesService);
    findAll(): Promise<{
        id: any;
        perfil_id: any;
        fecha_nacimiento: any;
        genero: any;
        tipo_sangre: any;
        direccion: any;
        contacto_emergencia_nombre: any;
        contacto_emergencia_telefono: any;
        perfiles: {
            nombre_completo: any;
            correo: any;
            telefono: any;
            estado: any;
        }[];
    }[]>;
    create(body: any): Promise<any>;
    update(id: string, body: any): Promise<any>;
}
