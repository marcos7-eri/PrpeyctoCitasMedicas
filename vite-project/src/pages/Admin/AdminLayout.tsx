import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { ReactNode } from 'react';

interface AdminLayoutProps {
  titulo: string;
  subtitulo: string;
  children: ReactNode;
}

interface PerfilGuardado {
  id: string;
  nombre_completo: string;
  correo: string;
  rol: string;
  estado: string;
  telefono?: string | null;
  foto_url?: string | null;
}

export default function AdminLayout({
  titulo,
  subtitulo,
  children,
}: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { cerrarSesion } = useAuth();

  const [perfil, setPerfil] = useState<PerfilGuardado | null>(null);

  useEffect(() => {
    const cargarPerfilLocal = () => {
      try {
        const perfilGuardado = localStorage.getItem('perfil');
        if (perfilGuardado) {
          setPerfil(JSON.parse(perfilGuardado));
        } else {
          setPerfil(null);
        }
      } catch {
        setPerfil(null);
      }
    };

    cargarPerfilLocal();

    window.addEventListener('storage', cargarPerfilLocal);
    window.addEventListener('perfil-actualizado', cargarPerfilLocal as EventListener);

    return () => {
      window.removeEventListener('storage', cargarPerfilLocal);
      window.removeEventListener('perfil-actualizado', cargarPerfilLocal as EventListener);
    };
  }, []);

  const iniciales = useMemo(() => {
    const nombre = perfil?.nombre_completo?.trim() || 'Administrador';
    const partes = nombre.split(' ').filter(Boolean);

    if (partes.length === 0) return 'AD';
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();

    return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
  }, [perfil]);

  const nombreMostrar = useMemo(() => {
    return perfil?.nombre_completo || 'Administrador';
  }, [perfil]);

  const rolMostrar = useMemo(() => {
    if (perfil?.rol === 'admin') return 'Administrador';
    if (perfil?.rol === 'doctor') return 'Doctor';
    if (perfil?.rol === 'paciente') return 'Paciente';
    return perfil?.rol || 'admin';
  }, [perfil]);

  const menuAdmin = [
    { nombre: 'Dashboard', ruta: '/admin', icono: 'M3 12L12 3L21 12L12 21L3 12Z' },
    { nombre: 'Usuarios', ruta: '/admin/usuarios', icono: 'M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z' },
    { nombre: 'Doctores', ruta: '/admin/doctores', icono: 'M9 12H15M12 9V15M20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12Z' },
    { nombre: 'Especialidades', ruta: '/admin/especialidades', icono: 'M19 11H5M19 11C20.1046 11 21 11.8954 21 13V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V13C3 11.8954 3.89543 11 5 11M19 11V7C19 5.89543 18.1046 5 17 5H15M5 11V7C5 5.89543 5.89543 5 7 5H9M15 5V3M15 5H9M9 5V3' },
    { nombre: 'Pacientes', ruta: '/admin/pacientes', icono: 'M17 20H7V18C7 15.2386 9.23858 13 12 13C14.7614 13 17 15.2386 17 18V20ZM12 11C13.6569 11 15 9.65685 15 8C15 6.34315 13.6569 5 12 5C10.3431 5 9 6.34315 9 8C9 9.65685 10.3431 11 12 11Z' },
    { nombre: 'Citas', ruta: '/admin/citas', icono: 'M8 7V3M16 7V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z' },
    { nombre: 'Notificaciones', ruta: '/admin/notificaciones', icono: 'M15 17H20L18.5951 15.5951C18.2141 15.2141 18 14.6973 18 14.1585V11C18 8.38757 16.3304 6.16509 14 5.34142V5C14 3.89543 13.1046 3 12 3C10.8954 3 10 3.89543 10 5V5.34142C7.66962 6.16509 6 8.38757 6 11V14.1585C6 14.6973 5.78595 15.2141 5.40493 15.5951L4 17H9M15 17V18C15 19.6569 13.6569 21 12 21C10.3431 21 9 19.6569 9 18V17M15 17H9' },
    { nombre: 'Auditoria', ruta: '/admin/auditoria', icono: 'M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5M12 12H15M12 16H15M9 12H9.01M9 16H9.01' },
    { nombre: 'Perfil', ruta: '/admin/perfil', icono: 'M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7ZM12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z' },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.animatedBg}>
        <div style={styles.orb1} />
        <div style={styles.orb2} />
        <div style={styles.orb3} />
      </div>

      <aside style={styles.sidebar}>
        <div style={styles.logoArea}>
          <div style={styles.logoIcon}>
            <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
              <path
                d="M16 2C8.268 2 2 8.268 2 16C2 23.732 8.268 30 16 30C23.732 30 30 23.732 30 16C30 8.268 23.732 2 16 2Z"
                fill="#319795"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
              <path
                d="M16 10V16L20 19"
                stroke="#FFFFFF"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <circle cx="16" cy="16" r="1.5" fill="#FFFFFF" />
            </svg>
          </div>
          <div>
            <h2 style={styles.logoTitle}>
              Clínica<span style={styles.logoHighlight}>Salud Total</span>
            </h2>
            <p style={styles.logoSubtitle}>Panel Administrador</p>
          </div>
        </div>

        <nav style={styles.nav}>
          {menuAdmin.map((item) => {
            const isActive = location.pathname === item.ruta;
            return (
              <button
                key={item.nombre}
                style={isActive ? styles.navItemActive : styles.navItem}
                onClick={() => navigate(item.ruta)}
              >
                <span style={styles.navIcon}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d={item.icono} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span>{item.nombre}</span>
                {isActive && <span style={styles.activeIndicator} />}
              </button>
            );
          })}
        </nav>

        <div style={styles.sidebarFooter}>
          <button style={styles.logoutBtn} onClick={cerrarSesion}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9M16 17L21 12M21 12L16 7M21 12H9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>{titulo}</h1>
            <p style={styles.pageSubtitle}>{subtitulo}</p>
          </div>

          <div style={styles.userInfo}>
            <div style={styles.userText}>
              <p style={styles.userName}>{nombreMostrar}</p>
              <p style={styles.userRole}>{rolMostrar}</p>
            </div>

            {perfil?.foto_url ? (
              <img
                src={perfil.foto_url}
                alt={nombreMostrar}
                style={styles.avatarImage}
              />
            ) : (
              <div style={styles.avatar}>
                <span>{iniciales}</span>
              </div>
            )}
          </div>
        </header>

        <div style={styles.content}>{children}</div>
      </main>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#0A0F1C',
    display: 'flex',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },
  animatedBg: {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 0,
  },
  orb1: {
    position: 'absolute',
    top: '-10%',
    right: '-5%',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(49,151,149,0.25) 0%, transparent 70%)',
    filter: 'blur(60px)',
    animation: 'float 15s ease-in-out infinite',
  },
  orb2: {
    position: 'absolute',
    bottom: '-10%',
    left: '-5%',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(79,70,229,0.15) 0%, transparent 70%)',
    filter: 'blur(60px)',
    animation: 'float 20s ease-in-out infinite reverse',
  },
  orb3: {
    position: 'absolute',
    top: '40%',
    left: '30%',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%)',
    filter: 'blur(60px)',
    animation: 'float 25s ease-in-out infinite',
  },
  sidebar: {
    width: '280px',
    background: 'rgba(20, 24, 35, 0.8)',
    backdropFilter: 'blur(20px)',
    borderRight: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 20px',
    position: 'relative',
    zIndex: 10,
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    paddingBottom: '24px',
    marginBottom: '24px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  logoIcon: {
    width: '48px',
    height: '48px',
    background: 'rgba(49,151,149,0.15)',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#FFFFFF',
    margin: 0,
  },
  logoHighlight: {
    color: '#319795',
  },
  logoSubtitle: {
    fontSize: '11px',
    color: '#94A3B8',
    margin: '4px 0 0',
  },
  nav: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: 'transparent',
    border: 'none',
    borderRadius: '12px',
    color: '#94A3B8',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative',
  },
  navItemActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: 'rgba(49,151,149,0.15)',
    border: 'none',
    borderRadius: '12px',
    color: '#319795',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    position: 'relative',
  },
  navIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    width: '3px',
    height: '20px',
    background: '#319795',
    borderRadius: '3px',
  },
  sidebarFooter: {
    marginTop: 'auto',
    paddingTop: '24px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: 'none',
    borderRadius: '12px',
    color: '#FCA5A5',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  main: {
    flex: 1,
    padding: '24px 32px',
    position: 'relative',
    zIndex: 10,
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '28px',
    padding: '20px 24px',
    background: 'rgba(20, 24, 35, 0.6)',
    backdropFilter: 'blur(12px)',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  pageTitle: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#FFFFFF',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  pageSubtitle: {
    fontSize: '13px',
    color: '#94A3B8',
    margin: '6px 0 0',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userText: {
    textAlign: 'right',
  },
  userName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#FFFFFF',
    margin: 0,
  },
  userRole: {
    fontSize: '12px',
    color: '#319795',
    margin: '4px 0 0',
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #319795 0%, #1a5a58 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: '16px',
    overflow: 'hidden',
    border: '2px solid rgba(255,255,255,0.1)',
  },
  avatarImage: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid rgba(255,255,255,0.1)',
    display: 'block',
  },
  content: {
    animation: 'fadeInUp 0.4s ease-out',
  },
};