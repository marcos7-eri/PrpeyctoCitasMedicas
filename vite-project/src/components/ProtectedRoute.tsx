import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  rolPermitido?: 'admin' | 'doctor' | 'paciente';
}

export default function ProtectedRoute({
  children,
  rolPermitido,
}: ProtectedRouteProps) {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return <h2>Cargando...</h2>;
  }

  if (!usuario) {
    return <Navigate to="/" replace />;
  }

  if (rolPermitido && usuario.rol !== rolPermitido) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}