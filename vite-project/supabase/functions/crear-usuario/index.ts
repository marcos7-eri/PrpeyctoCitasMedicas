// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Método no permitido' }), {
        status: 405,
        headers: corsHeaders,
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const supabaseUrl = Deno.env.get('URL')!;
    const anonKey = Deno.env.get('ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY')!;

    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Usuario no autenticado' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const { data: perfilAdmin, error: perfilError } = await supabaseAdmin
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (perfilError || !perfilAdmin || perfilAdmin.rol !== 'admin') {
      return new Response(JSON.stringify({ error: 'Solo un admin puede crear usuarios' }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    const body = await req.json();

    const {
      nombre_completo,
      correo,
      telefono,
      contrasena,
      rol,
      estado,
    } = body;

    if (!nombre_completo || !correo || !contrasena || !rol) {
      return new Response(JSON.stringify({ error: 'Faltan datos obligatorios' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (!['admin', 'paciente'].includes(rol)) {
      return new Response(
        JSON.stringify({ error: 'Desde Usuarios solo se puede crear admin o paciente' }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    const { data: nuevoAuth, error: createAuthError } =
      await supabaseAdmin.auth.admin.createUser({
        email: correo,
        password: contrasena,
        email_confirm: true,
        user_metadata: {
          nombre_completo,
          telefono: telefono || '',
          rol,
        },
      });

    if (createAuthError || !nuevoAuth.user) {
      return new Response(
        JSON.stringify({
          error: createAuthError?.message || 'No se pudo crear el usuario auth',
        }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    const userId = nuevoAuth.user.id;

    const { error: updatePerfilError } = await supabaseAdmin
      .from('perfiles')
      .update({
        nombre_completo,
        correo,
        telefono: telefono || '',
        rol,
        estado: estado || 'activo',
      })
      .eq('id', userId);

    if (updatePerfilError) {
      return new Response(
        JSON.stringify({
          error:
            'Usuario creado, pero falló la actualización del perfil: ' +
            updatePerfilError.message,
        }),
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }

    if (rol === 'paciente') {
      const { error: pacienteError } = await supabaseAdmin
        .from('pacientes')
        .insert({
          perfil_id: userId,
        });

      if (pacienteError) {
        return new Response(
          JSON.stringify({
            error:
              'Usuario creado, pero falló el registro en pacientes: ' +
              pacienteError.message,
          }),
          {
            status: 500,
            headers: corsHeaders,
          }
        );
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        message: 'Usuario creado correctamente',
        user_id: userId,
      }),
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Error inesperado',
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});