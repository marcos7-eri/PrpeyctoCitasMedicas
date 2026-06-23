import { OnModuleInit } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { INotificacionesService } from '../interfaces/INotificacionesService';
import { EventBusService } from '../events/event-bus.service';
export declare class NotificacionesService implements INotificacionesService, OnModuleInit {
    private readonly supabaseService;
    private readonly eventBus;
    private readonly logger;
    constructor(supabaseService: SupabaseService, eventBus: EventBusService);
    onModuleInit(): void;
    findAll(usuarioId?: string): Promise<any[]>;
    create(body: {
        usuario_id?: string;
        titulo: string;
        mensaje: string;
        tipo?: string;
    }): Promise<any>;
    update(id: string, body: any): Promise<any>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
    private enviarPush;
}
