import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Login from '../pages/Login';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';

// Paciente
import CitasPaciente from '../pages/paciente/CitasPaciente';

// Admin
import DashboardAdmin from '../pages/Admin/DashboardAdmin';
import UsuariosAdmin from '../pages/Admin/UsuariosAdmin';
import DoctoresAdmin from '../pages/Admin/DoctoresAdmin';
import EspecialidadesAdmin from '../pages/Admin/EspecialidadesAdmin';
import PacientesAdmin from '../pages/Admin/PacientesAdmin';
import CitasAdmin from '../pages/Admin/CitasAdmin';
import NotificacionesAdmin from '../pages/Admin/NotificacionesAdmin';
import AuditoriaAdmin from '../pages/Admin/AuditoriaAdmin';
import PerfilAdmin from '../pages/Admin/PerfilAdmin';

// Doctor
import DashboardDoctor from '../pages/doctor/DashboardDoctor'
import HorariosDoctor from '../pages/doctor/HorariosDoctor'
import CitasDoctor from '../pages/doctor/CitasDoctor'
import HistorialDoctor from '../pages/doctor/HistorialDoctor'
import NotificacionesDoctor from '../pages/doctor/NotificacionesDoctor'
import PerfilDoctor from '../pages/doctor/PerfilDoctor';
import PacientesDoctor from '../pages/doctor/PacientesDoctor';

function Paciente() {
  const { usuario, cerrarSesion } = useAuth();

  return (
    <div>
      <h1>Bienvenido Paciente</h1>
      <p>Nombre: {usuario?.nombre_completo}</p>
      <p>Correo: {usuario?.correo}</p>
      <p>Rol: {usuario?.rol}</p>

      <Link to="/paciente/citas">
        <button>Ver mis citas</button>
      </Link>

      <br /><br />

      <button onClick={cerrarSesion}>Cerrar sesión</button>
    </div>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute rolPermitido="admin">
              <DashboardAdmin />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/usuarios"
          element={
            <ProtectedRoute rolPermitido="admin">
              <UsuariosAdmin />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/doctores"
          element={
            <ProtectedRoute rolPermitido="admin">
              <DoctoresAdmin />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/especialidades"
          element={
            <ProtectedRoute rolPermitido="admin">
              <EspecialidadesAdmin />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/pacientes"
          element={
            <ProtectedRoute rolPermitido="admin">
              <PacientesAdmin />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/citas"
          element={
            <ProtectedRoute rolPermitido="admin">
              <CitasAdmin />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/notificaciones"
          element={
            <ProtectedRoute rolPermitido="admin">
              <NotificacionesAdmin />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/auditoria"
          element={
            <ProtectedRoute rolPermitido="admin">
              <AuditoriaAdmin />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/perfil"
          element={
            <ProtectedRoute rolPermitido="admin">
              <PerfilAdmin />
            </ProtectedRoute>
          }
        />

        {/* DOCTOR */}
        <Route
          path="/doctor"
          element={
            <ProtectedRoute rolPermitido="doctor">
              <DashboardDoctor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/horarios"
          element={
            <ProtectedRoute rolPermitido="doctor">
              <HorariosDoctor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/citas"
          element={
            <ProtectedRoute rolPermitido="doctor">
              <CitasDoctor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/historial"
          element={
            <ProtectedRoute rolPermitido="doctor">
              <HistorialDoctor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/notificaciones"
          element={
            <ProtectedRoute rolPermitido="doctor">
              <NotificacionesDoctor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/perfil"
          element={
            <ProtectedRoute rolPermitido="doctor">
              <PerfilDoctor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/pacientes"
          element={
            <ProtectedRoute rolPermitido="doctor">
              <PacientesDoctor />
            </ProtectedRoute>
          }
        />

        {/* PACIENTE */}
        <Route
          path="/paciente"
          element={
            <ProtectedRoute rolPermitido="paciente">
              <Paciente />
            </ProtectedRoute>
          }
        />

        <Route
          path="/paciente/citas"
          element={
            <ProtectedRoute rolPermitido="paciente">
              <CitasPaciente />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}