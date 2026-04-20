export default function DashboardDoctor() {
  const menuDoctor = [
    { nombre: 'Dashboard', ruta: '/doctor' },
    { nombre: 'Mis citas', ruta: '/doctor/citas' },
    { nombre: 'Horarios', ruta: '/doctor/horarios' },
    { nombre: 'Pacientes', ruta: '/doctor/pacientes' },
    { nombre: 'Historial médico', ruta: '/doctor/historial' },
    { nombre: 'Notificaciones', ruta: '/doctor/notificaciones' },
    { nombre: 'Perfil', ruta: '/doctor/perfil' },
  ];

  const cards = [
    { titulo: 'Citas del día', valor: '8', subtitulo: '2 pendientes', icono: '📅' },
    { titulo: 'Pacientes atendidos', valor: '126', subtitulo: '+12 este mes', icono: '👥' },
    { titulo: 'Horarios activos', valor: '5', subtitulo: 'Lunes a viernes', icono: '⏰' },
    { titulo: 'Notificaciones', valor: '3', subtitulo: '1 sin leer', icono: '🔔' },
  ];

  const citas = [
    { paciente: 'Juan Pérez', fecha: '2026-04-20', hora: '08:00', estado: 'Pendiente' },
    { paciente: 'Ana Rojas', fecha: '2026-04-20', hora: '09:30', estado: 'Confirmada' },
    { paciente: 'Mario López', fecha: '2026-04-20', hora: '11:00', estado: 'Pendiente' },
    { paciente: 'Carlos Ruiz', fecha: '2026-04-20', hora: '14:30', estado: 'Confirmada' },
  ];

  return (
    <div style={styles.contenedorGeneral}>
      {/* Fondo animado */}
      <div style={styles.animatedBackground}>
        <div style={styles.gradientOrb1}></div>
        <div style={styles.gradientOrb2}></div>
        <div style={styles.gradientOrb3}></div>
      </div>

      <aside style={styles.sidebar}>
        <div style={styles.logoBox}>
          <div style={styles.logoIcono}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 2C8.268 2 2 8.268 2 16C2 23.732 8.268 30 16 30C23.732 30 30 23.732 30 16C30 8.268 23.732 2 16 2Z" fill="#319795" stroke="#FFFFFF" strokeWidth="1.5"/>
              <path d="M16 10V16L20 19" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="16" cy="16" r="1.5" fill="#FFFFFF"/>
            </svg>
          </div>
          <div>
            <h2 style={styles.logoTitulo}>Clínica<span style={styles.logoHighlight}>Salud Total</span></h2>
            <p style={styles.logoSubtitulo}>Panel Doctor</p>
          </div>
        </div>

        <nav style={styles.menu}>
          {menuDoctor.map((item, index) => (
            <button
              key={item.nombre}
              style={index === 0 ? styles.menuActivo : styles.menuItem}
              className="menu-item"
            >
              <span style={styles.menuIcono}>
                {item.nombre === 'Dashboard' && (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                    <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                    <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                    <rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                  </svg>
                )}
                {item.nombre === 'Mis citas' && (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M2 6H18M5 2V4M15 2V4M4 10H7M10 10H13M4 14H7M10 14H13M3 4H17C17.5523 4 18 4.44772 18 5V17C18 17.5523 17.5523 18 17 18H3C2.44772 18 2 17.5523 2 17V5C2 4.44772 2.44772 4 3 4Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                )}
                {item.nombre === 'Horarios' && (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M10 4V10L13 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                )}
                {item.nombre === 'Pacientes' && (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M13 5C13 6.65685 11.6569 8 10 8C8.34315 8 7 6.65685 7 5C7 3.34315 8.34315 2 10 2C11.6569 2 13 3.34315 13 5Z" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M4 17C4 14.2386 6.23858 12 9 12H11C13.7614 12 16 14.2386 16 17V18H4V17Z" stroke="currentColor" strokeWidth="1.2"/>
                  </svg>
                )}
                {item.nombre === 'Perfil' && (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M4 16C4 13.2386 6.23858 11 9 11H11C13.7614 11 16 13.2386 16 16V17H4V16Z" stroke="currentColor" strokeWidth="1.2"/>
                  </svg>
                )}
              </span>
              {item.nombre}
            </button>
          ))}
        </nav>

        <div style={styles.sidebarFooter}>
          <button style={styles.botonCerrar} className="logout-button">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M7 2H3C2.46957 2 1.96086 2.21071 1.58579 2.58579C1.21071 2.96086 1 3.46957 1 4V14C1 14.5304 1.21071 15.0391 1.58579 15.4142C1.96086 15.7893 2.46957 16 3 16H7M12 12L16 8M16 8L12 4M16 8H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.titulo}>Panel del Doctor</h1>
            <p style={styles.subtitulo}>
              Gestión de agenda, pacientes e historial médico
            </p>
          </div>

          <div style={styles.usuarioBox}>
            <div style={styles.usuarioInfo}>
              <p style={styles.usuarioNombre}>Dr. Carlos Rodríguez</p>
              <p style={styles.usuarioRol}>Cardiología</p>
            </div>
            <div style={styles.avatar}>
              <span style={styles.avatarTexto}>DR</span>
            </div>
          </div>
        </header>

        <section style={styles.gridCards}>
          {cards.map((card, index) => (
            <div key={card.titulo} style={styles.card} className="card-hover">
              <div style={styles.cardIcono}>{card.icono}</div>
              <div>
                <p style={styles.cardTitulo}>{card.titulo}</p>
                <h3 style={styles.cardValor}>{card.valor}</h3>
                <p style={styles.cardSubtitulo}>{card.subtitulo}</p>
              </div>
            </div>
          ))}
        </section>

        <div style={styles.gridContenido}>
          <div style={styles.tablaBox}>
            <div style={styles.tablaHeader}>
              <h3 style={styles.tablaTitulo}>📋 Mis próximas citas</h3>
              <button style={styles.verMasBoton}>Ver todas →</button>
            </div>

            <table style={styles.tabla}>
              <thead>
                <tr>
                  <th style={styles.th}>Paciente</th>
                  <th style={styles.th}>Fecha</th>
                  <th style={styles.th}>Hora</th>
                  <th style={styles.th}>Estado</th>
                  <th style={styles.th}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {citas.map((cita, index) => (
                  <tr key={index} className="table-row">
                    <td style={styles.td}>
                      <div style={styles.pacienteInfo}>
                        <div style={styles.pacienteAvatar}>
                          {cita.paciente.charAt(0)}
                        </div>
                        <span>{cita.paciente}</span>
                      </div>
                    </td>
                    <td style={styles.td}>{cita.fecha}</td>
                    <td style={styles.td}>{cita.hora}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.estado,
                        ...(cita.estado === 'Confirmada' ? styles.estadoConfirmada : styles.estadoPendiente)
                      }}>
                        {cita.estado}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <button style={styles.botonAccion}>Atender</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={styles.accionesBox}>
            <h3 style={styles.accionesTitulo}>⚡ Acciones rápidas</h3>
            
            <div style={styles.accionesLista}>
              <button style={styles.botonPrincipal}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 3V9M9 9V15M9 9H15M9 9H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Nueva cita
              </button>
              
              <button style={styles.botonSecundario}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M3 9H15M9 3V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Agregar horario
              </button>
              
              <button style={styles.botonSecundario}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M2 14H16M2 4H16M6 8H12M4 2H14C15.1046 2 16 2.89543 16 4V14C16 15.1046 15.1046 16 14 16H4C2.89543 16 2 15.1046 2 14V4C2 2.89543 2.89543 2 4 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Ver historial
              </button>
            </div>

            <div style={styles.resumenCard}>
              <div style={styles.resumenHeader}>
                <span style={styles.resumenIcono}>📊</span>
                <p style={styles.resumenTitulo}>Resumen del día</p>
              </div>
              <div style={styles.resumenStats}>
                <div>
                  <p style={styles.resumenNumero}>8</p>
                  <p style={styles.resumenLabel}>Citas</p>
                </div>
                <div>
                  <p style={styles.resumenNumero}>5</p>
                  <p style={styles.resumenLabel}>Atendidos</p>
                </div>
                <div>
                  <p style={styles.resumenNumero}>3</p>
                  <p style={styles.resumenLabel}>Pendientes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        @keyframes gradientShift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .menu-item {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .menu-item:hover {
          background-color: rgba(49, 151, 149, 0.1);
          transform: translateX(4px);
        }
        
        .logout-button {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .logout-button:hover {
          background-color: rgba(229, 62, 62, 0.15);
          transform: translateY(-2px);
        }
        
        .card-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -12px rgba(0, 0, 0, 0.3);
        }
        
        .table-row {
          transition: background-color 0.2s ease;
        }
        
        .table-row:hover {
          background-color: rgba(49, 151, 149, 0.05);
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  contenedorGeneral: {
    position: 'relative',
    minHeight: '100vh',
    width: '100%',
    display: 'grid',
    gridTemplateColumns: '280px 1fr',
    gap: '20px',
    padding: '20px',
    background: '#0A0F1C',
    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    overflow: 'hidden',
  },
  animatedBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: 0,
  },
  gradientOrb1: {
    position: 'absolute',
    top: '-10%',
    right: '-5%',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(49,151,149,0.15) 0%, rgba(49,151,149,0) 70%)',
    filter: 'blur(60px)',
    animation: 'gradientShift 20s ease-in-out infinite',
  },
  gradientOrb2: {
    position: 'absolute',
    bottom: '-10%',
    left: '-5%',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(79,70,229,0.1) 0%, rgba(79,70,229,0) 70%)',
    filter: 'blur(60px)',
    animation: 'gradientShift 15s ease-in-out infinite reverse',
  },
  gradientOrb3: {
    position: 'absolute',
    top: '40%',
    left: '30%',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(236,72,153,0.05) 0%, rgba(236,72,153,0) 70%)',
    filter: 'blur(60px)',
    animation: 'gradientShift 25s ease-in-out infinite',
  },
  sidebar: {
    position: 'relative',
    zIndex: 2,
    background: 'rgba(15, 18, 28, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '28px',
    padding: '28px 20px',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 'calc(100vh - 40px)',
    overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  logoBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '32px',
    paddingBottom: '24px',
    borderBottom: '1px solid rgba(49, 151, 149, 0.2)',
  },
  logoIcono: {
    width: '48px',
    height: '48px',
    background: 'linear-gradient(135deg, rgba(49,151,149,0.2) 0%, rgba(49,151,149,0.1) 100%)',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(49,151,149,0.3)',
    animation: 'float 3s ease-in-out infinite',
  },
  logoTitulo: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '700',
    color: '#FFFFFF',
  },
  logoHighlight: {
    color: '#319795',
  },
  logoSubtitulo: {
    margin: '4px 0 0',
    fontSize: '11px',
    color: '#94A3B8',
    fontWeight: '500',
  },
  menu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1,
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'transparent',
    color: '#CBD5E1',
    border: 'none',
    borderRadius: '14px',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '500',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  },
  menuActivo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'linear-gradient(135deg, #319795 0%, #267B79 100%)',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '14px',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '500',
    textAlign: 'left',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(49, 151, 149, 0.3)',
  },
  menuIcono: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
  },
  sidebarFooter: {
    marginTop: 'auto',
    paddingTop: '24px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  },
  botonCerrar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    background: 'rgba(229, 62, 62, 0.1)',
    color: '#FCA5A5',
    border: '1px solid rgba(229, 62, 62, 0.2)',
    borderRadius: '14px',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  },
  main: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    minHeight: 'calc(100vh - 40px)',
    overflowY: 'auto',
    minWidth: 0,
  },
  header: {
    background: 'rgba(15, 18, 28, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '28px',
    padding: '24px 28px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  titulo: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: '-0.02em',
  },
  subtitulo: {
    margin: '8px 0 0',
    fontSize: '14px',
    color: '#94A3B8',
  },
  usuarioBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  usuarioInfo: {
    textAlign: 'right',
  },
  usuarioNombre: {
    margin: 0,
    fontWeight: '600',
    color: '#FFFFFF',
    fontSize: '14px',
  },
  usuarioRol: {
    margin: '4px 0 0',
    fontSize: '12px',
    color: '#319795',
    fontWeight: '500',
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #319795 0%, #0A2540 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid rgba(49, 151, 149, 0.3)',
  },
  avatarTexto: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: '16px',
  },
  gridCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
  },
  card: {
    background: 'rgba(15, 18, 28, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    padding: '24px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    transition: 'all 0.3s ease',
  },
  cardIcono: {
    fontSize: '40px',
  },
  cardTitulo: {
    margin: 0,
    fontSize: '14px',
    color: '#94A3B8',
    fontWeight: '500',
  },
  cardValor: {
    margin: '8px 0',
    fontSize: '32px',
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardSubtitulo: {
    margin: 0,
    fontSize: '12px',
    color: '#64748B',
  },
  gridContenido: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '20px',
  },
  tablaBox: {
    background: 'rgba(15, 18, 28, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  tablaHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tablaTitulo: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  verMasBoton: {
    background: 'transparent',
    border: 'none',
    color: '#319795',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'color 0.2s ease',
  },
  tabla: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '16px 24px',
    color: '#94A3B8',
    fontSize: '13px',
    fontWeight: '500',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  },
  td: {
    padding: '16px 24px',
    color: '#CBD5E1',
    fontSize: '14px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  },
  pacienteInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  pacienteAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'rgba(49, 151, 149, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#319795',
    fontWeight: '600',
    fontSize: '14px',
  },
  estado: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: '500',
  },
  estadoConfirmada: {
    background: 'rgba(16, 185, 129, 0.2)',
    color: '#10B981',
  },
  estadoPendiente: {
    background: 'rgba(245, 158, 11, 0.2)',
    color: '#F59E0B',
  },
  botonAccion: {
    background: 'rgba(49, 151, 149, 0.2)',
    color: '#319795',
    border: 'none',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  accionesBox: {
    background: 'rgba(15, 18, 28, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    padding: '24px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  accionesTitulo: {
    margin: '0 0 20px',
    fontSize: '18px',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  accionesLista: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '24px',
  },
  botonPrincipal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    width: '100%',
    background: 'linear-gradient(135deg, #319795 0%, #267B79 100%)',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '14px',
    padding: '12px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  botonSecundario: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    width: '100%',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#CBD5E1',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '14px',
    padding: '12px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  resumenCard: {
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '16px',
    padding: '16px',
  },
  resumenHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
  },
  resumenIcono: {
    fontSize: '20px',
  },
  resumenTitulo: {
    margin: 0,
    fontSize: '14px',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resumenStats: {
    display: 'flex',
    justifyContent: 'space-around',
    textAlign: 'center',
  },
  resumenNumero: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '700',
    color: '#319795',
  },
  resumenLabel: {
    margin: '4px 0 0',
    fontSize: '12px',
    color: '#94A3B8',
  },
};