'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  rolPermitido?: 'admin' | 'doctor' | 'paciente';
}

export default function ProtectedRoute({ children, rolPermitido }: ProtectedRouteProps) {
  const { usuario, cargando } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!cargando && !usuario) {
      router.replace('/login');
    }
    if (!cargando && usuario && rolPermitido && usuario.rol !== rolPermitido) {
      router.replace('/login');
    }
  }, [cargando, usuario, rolPermitido, router]);

  if (cargando) {
    return <h2 style={{ color: '#fff', textAlign: 'center', padding: '40px' }}>Cargando...</h2>;
  }

  if (!usuario) return null;
  if (rolPermitido && usuario.rol !== rolPermitido) return null;

  return <>{children}</>;
}
