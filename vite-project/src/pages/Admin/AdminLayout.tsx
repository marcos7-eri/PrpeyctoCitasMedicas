import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { ReactNode } from 'react';

interface AdminLayoutProps {
  titulo: string;
  subtitulo: string;
  children: ReactNode;
}

export default function AdminLayout({
  titulo,
  subtitulo,
  children,
}: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { cerrarSesion } = useAuth();

  const menuAdmin = [
    { nombre: 'Dashboard', ruta: '/admin' },
    { nombre: 'Usuarios', ruta: '/admin/usuarios' },
    { nombre: 'Doctores', ruta: '/admin/doctores' },
    { nombre: 'Especialidades', ruta: '/admin/especialidades' },
    { nombre: 'Pacientes', ruta: '/admin/pacientes' },
    { nombre: 'Citas', ruta: '/admin/citas' },
    { nombre: 'Notificaciones', ruta: '/admin/notificaciones' },
    { nombre: 'Auditoria', ruta: '/admin/auditoria' },
    { nombre: 'Perfil', ruta: '/admin/perfil' },
  ];

  return (
    <div style={styles.contenedorGeneral}>
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
            <h2 style={styles.logoTitulo}>Mini Clinica</h2>
            <p style={styles.logoSubtitulo}>Administrador</p>
          </div>
        </div>

        <nav style={styles.menu}>
          {menuAdmin.map((item) => {
            const activo = location.pathname === item.ruta;

            return (
              <button
                key={item.nombre}
                style={activo ? styles.menuActivo : styles.menuItem}
                onClick={() => navigate(item.ruta)}
                onMouseEnter={(e) => {
                  if (!activo) e.currentTarget.style.backgroundColor = '#334155';
                }}
                onMouseLeave={(e) => {
                  if (!activo) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span style={styles.menuIcono}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                    <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                    <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                    <rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                  </svg>
                </span>
                {item.nombre}
              </button>
            );
          })}
        </nav>

        <div style={styles.sidebarFooter}>
          <button style={styles.botonCerrar} onClick={cerrarSesion}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M7 2H3C2.46957 2 1.96086 2.21071 1.58579 2.58579C1.21071 2.96086 1 3.46957 1 4V14C1 14.5304 1.21071 15.0391 1.58579 15.4142C1.96086 15.7893 2.46957 16 3 16H7M12 12L16 8M16 8L12 4M16 8H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Cerrar sesion
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.titulo}>{titulo}</h1>
            <p style={styles.subtitulo}>{subtitulo}</p>
          </div>

          <div style={styles.usuarioBox}>
            <div style={styles.usuarioInfo}>
              <p style={styles.usuarioNombre}>Administrador</p>
              <p style={styles.usuarioRol}>admin</p>
            </div>
            <div style={styles.avatar}>
              <span style={styles.avatarTexto}>AD</span>
            </div>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}

export const styles: Record<string, React.CSSProperties> = {
  contenedorGeneral: {
  minHeight: '100vh',
  width: '100%',
  display: 'grid',
  gridTemplateColumns: '280px 1fr',
  gap: '20px',
  padding: '20px',
  background: '#F1F5F9',
  fontFamily: "'Inter', system-ui, sans-serif",
  boxSizing: 'border-box',
},
  sidebar: {
  background: '#0A2540',
  borderRadius: '24px',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 'calc(100vh - 40px)',
  overflowY: 'auto',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  boxSizing: 'border-box',
},
  logoBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '32px',
    paddingBottom: '24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  logoIcono: {
    width: '48px',
    height: '48px',
    background: 'rgba(49, 151, 149, 0.15)',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTitulo: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '700',
    color: '#FFFFFF',
  },
  logoSubtitulo: {
    margin: '4px 0 0',
    fontSize: '12px',
    color: '#319795',
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
  },
  menuActivo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: '#319795',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '14px',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '500',
    textAlign: 'left',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(49, 151, 149, 0.3)',
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
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  botonCerrar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    color: '#FCA5A5',
    border: 'none',
    borderRadius: '14px',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  main: {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  minHeight: 'calc(100vh - 40px)',
  overflowY: 'auto',
  minWidth: 0,
},
  header: {
    background: '#FFFFFF',
    borderRadius: '24px',
    padding: '24px 28px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  titulo: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '700',
    color: '#0A2540',
  },
  subtitulo: {
    margin: '8px 0 0',
    fontSize: '14px',
    color: '#64748B',
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
    color: '#1E293B',
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
  },
  avatarTexto: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: '16px',
  },
  gridCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
  },
  card: {
    background: '#FFFFFF',
    borderRadius: '20px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  cardTitulo: {
    color: '#64748B',
    margin: 0,
    fontSize: '14px',
    fontWeight: '500',
  },
  cardValor: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#0A2540',
    margin: '0 0 8px',
  },
  cardSubtitulo: {
    color: '#94A3B8',
    margin: 0,
    fontSize: '13px',
  },
  gridContenido: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '20px',
  },
  tablaBox: {
    background: '#FFFFFF',
    borderRadius: '24px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  tablaHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #E2E8F0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tablaTitulo: {
    margin: 0,
    color: '#0A2540',
    fontSize: '18px',
    fontWeight: '600',
  },
  verMasBoton: {
    background: 'transparent',
    border: 'none',
    color: '#319795',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    gap: '16px',
  },
  emptyStateText: {
    color: '#94A3B8',
    fontSize: '14px',
    margin: 0,
  },
  accionesBox: {
    background: '#FFFFFF',
    borderRadius: '24px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  accionesTitulo: {
    margin: '0 0 20px',
    color: '#0A2540',
    fontSize: '18px',
    fontWeight: '600',
  },
  accionesLista: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  botonPrincipal: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: '#319795',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '14px',
    padding: '14px 18px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  botonSecundario: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: '#F1F5F9',
    color: '#1E293B',
    border: 'none',
    borderRadius: '14px',
    padding: '14px 18px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  bloque: {
    background: '#FFFFFF',
    borderRadius: '24px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  bloqueTitulo: {
    margin: '0 0 16px',
    fontSize: '20px',
    fontWeight: '600',
    color: '#0A2540',
  },
  bloqueTexto: {
    margin: 0,
    color: '#64748B',
    fontSize: '14px',
  },
};


AdminLayout