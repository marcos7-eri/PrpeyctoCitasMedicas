import { useNavigate } from 'react-router-dom';
import AdminLayout, { styles } from './AdminLayout';

export default function DashboardAdmin() {
  const navigate = useNavigate();

  return (
    <AdminLayout
      titulo="Panel Administrador"
      subtitulo="Sistema de gestion de citas medicas e historial clinico"
    >
      <section style={styles.gridCards}>
        <div style={styles.card}>
          <p style={styles.cardTitulo}>Doctores registrados</p>
          <h3 style={styles.cardValor}>0</h3>
          <p style={styles.cardSubtitulo}>Sin datos disponibles</p>
        </div>

        <div style={styles.card}>
          <p style={styles.cardTitulo}>Pacientes registrados</p>
          <h3 style={styles.cardValor}>0</h3>
          <p style={styles.cardSubtitulo}>Sin datos disponibles</p>
        </div>

        <div style={styles.card}>
          <p style={styles.cardTitulo}>Citas del dia</p>
          <h3 style={styles.cardValor}>0</h3>
          <p style={styles.cardSubtitulo}>Sin datos disponibles</p>
        </div>

        <div style={styles.card}>
          <p style={styles.cardTitulo}>Notificaciones</p>
          <h3 style={styles.cardValor}>0</h3>
          <p style={styles.cardSubtitulo}>Sin datos disponibles</p>
        </div>
      </section>

      <section style={styles.gridContenido}>
        <div style={styles.tablaBox}>
          <div style={styles.tablaHeader}>
            <h3 style={styles.tablaTitulo}>Proximas citas</h3>
            <button style={styles.verMasBoton} onClick={() => navigate('/admin/citas')}>
              Ver todas
            </button>
          </div>
          <div style={styles.emptyState}>
            <p style={styles.emptyStateText}>No hay citas programadas</p>
          </div>
        </div>

        <div style={styles.accionesBox}>
          <h3 style={styles.accionesTitulo}>Accesos rapidos</h3>
          <div style={styles.accionesLista}>
            <button style={styles.botonPrincipal} onClick={() => navigate('/admin/doctores')}>
              Registrar doctor
            </button>
            <button style={styles.botonSecundario} onClick={() => navigate('/admin/especialidades')}>
              Crear especialidad
            </button>
            <button style={styles.botonSecundario} onClick={() => navigate('/admin/auditoria')}>
              Ver auditoria
            </button>
            <button style={styles.botonSecundario} onClick={() => navigate('/admin/citas')}>
              Gestionar citas
            </button>
          </div>
        </div>
      </section>
    </AdminLayout>
  );
}