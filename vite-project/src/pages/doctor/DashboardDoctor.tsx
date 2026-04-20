export default function DashboardDoctor() {
  const menuDoctor = [
    'Dashboard',
    'Mis citas',
    'Horarios',
    'Pacientes',
    'Historial médico',
    'Notificaciones',
    'Perfil',
  ];

  const cards = [
    { titulo: 'Citas del día', valor: '8', subtitulo: '2 pendientes' },
    { titulo: 'Pacientes atendidos', valor: '126', subtitulo: 'Historial actualizado' },
    { titulo: 'Horarios activos', valor: '5', subtitulo: 'Lunes a viernes' },
    { titulo: 'Notificaciones', valor: '3', subtitulo: '1 sin leer' },
  ];

  const citas = [
    { paciente: 'Juan Pérez', fecha: '2026-04-20', hora: '08:00', estado: 'Pendiente' },
    { paciente: 'Ana Rojas', fecha: '2026-04-20', hora: '09:30', estado: 'Confirmada' },
    { paciente: 'Mario López', fecha: '2026-04-20', hora: '11:00', estado: 'Pendiente' },
  ];

  return (
    <div style={styles.contenedorGeneral}>
      <aside style={styles.sidebar}>
        <div style={styles.logoBox}>
          <h2 style={styles.logoTitulo}>Mini Clínica</h2>
          <p style={styles.logoSubtitulo}>Doctor</p>
        </div>

        <nav style={styles.menu}>
          {menuDoctor.map((item, index) => (
            <button
              key={item}
              style={index === 0 ? styles.menuActivo : styles.menuItem}
            >
              {item}
            </button>
          ))}
        </nav>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.titulo}>Panel Doctor</h1>
            <p style={styles.subtitulo}>
              Gestión de agenda, pacientes e historial médico
            </p>
          </div>

          <div style={styles.usuarioBox}>
            <div>
              <p style={styles.usuarioNombre}>Doctor Demo</p>
              <p style={styles.usuarioRol}>doctor</p>
            </div>
            <div style={styles.avatar}>D</div>
          </div>
        </header>

        <section style={styles.gridCards}>
          {cards.map((card) => (
            <div key={card.titulo} style={styles.card}>
              <p style={styles.cardTitulo}>{card.titulo}</p>
              <h3 style={styles.cardValor}>{card.valor}</h3>
              <p style={styles.cardSubtitulo}>{card.subtitulo}</p>
            </div>
          ))}
        </section>

        <section style={styles.gridContenido}>
          <div style={styles.tablaBox}>
            <div style={styles.tablaHeader}>
              <h3 style={styles.tablaTitulo}>Mis próximas citas</h3>
            </div>

            <table style={styles.tabla}>
              <thead>
                <tr>
                  <th style={styles.th}>Paciente</th>
                  <th style={styles.th}>Fecha</th>
                  <th style={styles.th}>Hora</th>
                  <th style={styles.th}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {citas.map((cita, index) => (
                  <tr key={index}>
                    <td style={styles.td}>{cita.paciente}</td>
                    <td style={styles.td}>{cita.fecha}</td>
                    <td style={styles.td}>{cita.hora}</td>
                    <td style={styles.td}>
                      <span style={styles.estado}>{cita.estado}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={styles.resumenBox}>
            <h3 style={styles.tablaTitulo}>Resumen rápido</h3>

            <div style={styles.resumenCard}>
              <p style={styles.resumenTitulo}>Próximo paciente</p>
              <p style={styles.resumenTexto}>Juan Pérez - 08:00</p>
            </div>

            <div style={styles.resumenCard}>
              <p style={styles.resumenTitulo}>Historial reciente</p>
              <p style={styles.resumenTexto}>3 registros creados hoy</p>
            </div>

            <div style={styles.resumenCard}>
              <p style={styles.resumenTitulo}>Acción sugerida</p>
              <p style={styles.resumenTexto}>Actualizar horario del viernes</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

const styles: any = {
  contenedorGeneral: {
    minHeight: '100vh',
    display: 'grid',
    gridTemplateColumns: '280px 1fr',
    background: '#f1f5f9',
    gap: '20px',
    padding: '20px',
  },
  sidebar: {
    background: '#0f172a',
    color: 'white',
    borderRadius: '24px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
  },
  logoBox: {
    marginBottom: '30px',
  },
  logoTitulo: {
    margin: 0,
    fontSize: '28px',
  },
  logoSubtitulo: {
    color: '#cbd5e1',
    marginTop: '8px',
  },
  menu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  menuItem: {
    background: '#1e293b',
    color: '#e2e8f0',
    border: 'none',
    borderRadius: '16px',
    padding: '14px',
    textAlign: 'left',
    cursor: 'pointer',
  },
  menuActivo: {
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '16px',
    padding: '14px',
    textAlign: 'left',
    cursor: 'pointer',
  },
  main: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  header: {
    background: 'white',
    borderRadius: '24px',
    padding: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titulo: {
    margin: 0,
    fontSize: '32px',
    color: '#1e293b',
  },
  subtitulo: {
    color: '#64748b',
    marginTop: '8px',
  },
  usuarioBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  usuarioNombre: {
    margin: 0,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  usuarioRol: {
    margin: 0,
    color: '#64748b',
    fontSize: '14px',
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: '#dbeafe',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#1d4ed8',
    fontWeight: 'bold',
  },
  gridCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
  },
  card: {
    background: 'white',
    borderRadius: '20px',
    padding: '20px',
  },
  cardTitulo: {
    color: '#64748b',
    margin: 0,
  },
  cardValor: {
    fontSize: '32px',
    color: '#1e293b',
    margin: '10px 0',
  },
  cardSubtitulo: {
    color: '#94a3b8',
    margin: 0,
  },
  gridContenido: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '20px',
  },
  tablaBox: {
    background: 'white',
    borderRadius: '24px',
    overflow: 'hidden',
  },
  tablaHeader: {
    padding: '20px',
    borderBottom: '1px solid #e2e8f0',
  },
  tablaTitulo: {
    margin: 0,
    color: '#1e293b',
  },
  tabla: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '16px',
    color: '#64748b',
    background: '#f8fafc',
  },
  td: {
    padding: '16px',
    borderTop: '1px solid #f1f5f9',
    color: '#334155',
  },
  estado: {
    background: '#dcfce7',
    color: '#15803d',
    padding: '6px 12px',
    borderRadius: '999px',
    fontSize: '14px',
  },
  resumenBox: {
    background: 'white',
    borderRadius: '24px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  resumenCard: {
    background: '#f8fafc',
    borderRadius: '16px',
    padding: '16px',
  },
  resumenTitulo: {
    margin: 0,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  resumenTexto: {
    marginTop: '8px',
    color: '#475569',
  },
};