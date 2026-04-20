import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface UsuarioPerfil {
  id: string;
  nombre_completo: string;
  correo: string;
  rol: 'admin' | 'doctor' | 'paciente';
  estado: 'activo' | 'inactivo';
}

interface AuthContextType {
  usuario: UsuarioPerfil | null;
  cargando: boolean;
  cerrarSesion: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  usuario: null,
  cargando: true,
  cerrarSesion: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioPerfil | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargarPerfil = async () => {
    const { data: sessionData } = await supabase.auth.getSession();

    const session = sessionData.session;

    if (!session) {
      setUsuario(null);
      setCargando(false);
      return;
    }

    const userId = session.user.id;

    const { data: perfil, error } = await supabase
      .from('perfiles')
      .select('id, nombre_completo, correo, rol, estado')
      .eq('id', userId)
      .single();

    if (error || !perfil) {
      setUsuario(null);
    } else {
      setUsuario(perfil);
    }

    setCargando(false);
  };

  useEffect(() => {
    cargarPerfil();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      cargarPerfil();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, cargando, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}